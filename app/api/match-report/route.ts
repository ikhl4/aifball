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

    // قاموس شعارات الأندية المعروفة
    const teamLogos: { [key: string]: string } = {
      'Argentina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Argentina_national_football_team_logo.svg/200px-Argentina_national_football_team_logo.svg.png',
      'France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/France_national_football_team_logo.svg/200px-France_national_football_team_logo.svg.png',
      'Real Madrid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png',
      'Barcelona': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png',
      'Al Hilal': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Al_Hilal_SFC_Logo.svg/200px-Al_Hilal_SFC_Logo.svg.png',
      'Al Nassr': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Al_Nassr_FC_Logo.svg/200px-Al_Nassr_FC_Logo.svg.png',
      'Al Ittihad': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Al-Ittihad_Club_%28Jeddah%29_logo.svg/200px-Al-Ittihad_Club_%28Jeddah%29_logo.svg.png',
    };

    const getTeamLogo = (teamName: string) => {
      // إذا كان الفريق في القاموس نرجع الشعار، وإلا نرجع null لكي تتعامل الواجهة مع اللون الرمادي
      return teamLogos[teamName] || null;
    };

    // دالة جلب صورة اللاعب
    const fetchPlayerImage = async (playerName: string) => {
      try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(playerName)}`);
        const data = await res.json();
        return data.player?.[0]?.strThumb || null;
      } catch {
        return null;
      }
    };

    const homeLogo = getTeamLogo(homeTeamName);
    const awayLogo = getTeamLogo(awayTeamName);

    const mapLineup = async (teamData: any) => {
      const starters = teamData.lineup.slice(0, 11);
      return await Promise.all(starters.map(async (p: any) => {
        const img = await fetchPlayerImage(p.player_name);
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
