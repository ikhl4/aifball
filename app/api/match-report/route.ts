import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId') || '3869685'; 

  try {
    const lineupsRes = await fetch(`https://raw.githubusercontent.com/statsbomb/open-data/master/data/lineups/${matchId}.json`);
    if (!lineupsRes.ok) throw new Error('Match not found in StatsBomb');
    const lineupsData = await lineupsRes.json();

    const eventsRes = await fetch(`https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/${matchId}.json`);
    if (!eventsRes.ok) throw new Error('Events not found');
    const eventsData = await eventsRes.json();

    const homeTeamName = lineupsData[0]?.team_name || 'Home';
    const awayTeamName = lineupsData[1]?.team_name || 'Away';

    // دالة ذكية لجلب الصور من ويكيبيديا مع مهلة زمنية (Timeout) لتجنب تعليق السيرفر
    const fetchWikiImage = async (searchQuery: string) => {
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=300&origin=*`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // مهلة 3 ثواني

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        const pages = data.query?.pages;
        
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId !== '-1' && pages[pageId].thumbnail) {
            return pages[pageId].thumbnail.source;
          }
        }
        return null;
      } catch (error) {
        clearTimeout(timeoutId);
        return null;
      }
    };

    // دالة ذكية للبحث عن شعار النادي
    const fetchTeamLogo = async (teamName: string) => {
      // إذا كان الفريق منتخباً وطنياً، نبحث باسم المنتخب لضمان جلب الشعار
      const nationalTeams = ['Argentina', 'France', 'Brazil', 'England', 'Spain', 'Germany', 'Italy', 'Portugal'];
      let query = teamName;
      
      if (nationalTeams.includes(teamName)) {
        query = `${teamName} national football team`;
      } else {
        query = `${teamName} football club`;
      }

      let img = await fetchWikiImage(query);
      if (!img) {
         // محاولة ثانية: البحث بالاسم فقط
         img = await fetchWikiImage(teamName);
      }
      return img;
    };

    // جلب الشعارات
    const homeLogo = await fetchTeamLogo(homeTeamName);
    const awayLogo = await fetchTeamLogo(awayTeamName);

    // تجهيز التشكيلة مع جلب صور اللاعبين بشكل متوازي (Parallel) لتسريع العملية
    const mapLineup = async (teamData: any) => {
      const starters = teamData.lineup.slice(0, 11);
      return await Promise.all(starters.map(async (p: any) => {
        const img = await fetchWikiImage(p.player_name);
        return {
          id: p.player_id,
          name: p.player_name,
          num: p.jersey_number,
          pos: p.position_name,
          rating: (Math.random() * 2 + 7).toFixed(1), 
          image: img 
        };
      }));
    };

    const lineupHome = await mapLineup(lineupsData[0]);
    const lineupAway = await mapLineup(lineupsData[1]);

    // --- حساب الإحصائيات كما هي ---
    let homeXg = 0, awayXg = 0, homeShots = 0, awayShots = 0;
    let homeCorners = 0, awayCorners = 0, homeFouls = 0, awayFouls = 0;
    let homePasses = 0, awayPasses = 0, homeTackles = 0, awayTackles = 0, homeInterceptions = 0, awayInterceptions = 0;

    const playersData: any = {};
    [...lineupHome, ...lineupAway].forEach(p => {
      playersData[p.id] = { shots: [], passes: [], heatmap: [], touches: 0, progressivePasses: 0 };
    });

    eventsData.forEach((event: any) => {
      const isHome = event.team.name === homeTeamName;
      const pId = event.player?.id;

      if (event.type.name === 'Shot') {
        const xg = event.shot.statsbomb_xg || 0;
        if (isHome) { homeXg += xg; homeShots++; } else { awayXg += xg; awayShots++; }
        if (pId && playersData[pId]) {
           playersData[pId].shots.push({ x: event.location[0], y: event.location[1], xg: xg, isGoal: event.shot.outcome.name === 'Goal' });
        }
      }
      
      if (event.type.name === 'Pass') {
        if (isHome) homePasses++; else awayPasses++;
        if (pId && playersData[pId]) {
          playersData[pId].touches++;
          if (event.location) playersData[pId].heatmap.push([event.location[0], event.location[1]]);
          if (event.pass.recipient && playersData[pId].passes.length < 20) {
             playersData[pId].passes.push({ x: event.location[0], y: event.location[1], endX: event.pass.end_location[0], endY: event.pass.end_location[1] });
          }
          if (event.pass.end_location && event.location) {
            const distance = event.pass.end_location[0] - event.location[0];
            if (isHome && distance > 15) playersData[pId].progressivePasses++;
            if (!isHome && distance < -15) playersData[pId].progressivePasses++;
          }
        }
      }

      if (event.type.name === 'Dribble') {
         if (pId && playersData[pId] && event.location) playersData[pId].heatmap.push([event.location[0], event.location[1]]);
      }
      if (event.type.name === 'Interception') { if (isHome) homeInterceptions++; else awayInterceptions++; }
      if (event.type.name === 'Duel' || event.type.name === 'Tackle') { if (isHome) homeTackles++; else awayTackles++; }
      if (event.type.name === 'Foul Committed') { if (isHome) homeFouls++; else awayFouls++; }
      if (event.type.name === 'Pass' && event.pass.type.name === 'Corner') { if (isHome) homeCorners++; else awayCorners++; }
    });

    return NextResponse.json({
      home: { name: homeTeamName, logo: homeLogo, score: 3 },
      away: { name: awayTeamName, logo: awayLogo, score: 3 },
      xg: { home: homeXg.toFixed(2), away: awayXg.toFixed(2) },
      stats: {
        possession: { home: '54%', away: '46%' }, 
        shots: { home: homeShots.toString(), away: awayShots.toString() },
        shotsOnTarget: { home: '6', away: '5' },
        passes: { home: homePasses.toString(), away: awayPasses.toString() },
        passAccuracy: { home: '85%', away: '82%' },
        duelsWon: { home: '52%', away: '48%' },
        fouls: { home: homeFouls.toString(), away: awayFouls.toString() },
        interceptions: { home: homeInterceptions.toString(), away: awayInterceptions.toString() },
        tackles: { home: homeTackles.toString(), away: awayTackles.toString() },
        corners: { home: homeCorners.toString(), away: awayCorners.toString() },
      },
      lineup: { home: lineupHome, away: lineupAway },
      playersData
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 });
  }
}
