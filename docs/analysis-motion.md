# Step-by-step tactical playback

AnalysisPitch now interpolates player circles, number labels, the ball and arrow endpoints together between supplied frames. Identity and side must match for an interpolated player path; a newly appearing player gets no invented path. Coordinates remain interpretive.

Arabic controls include play/pause, previous/next, restart, direct step selection, speed and a step counter with commentary. Play holds each stage for reading and stops at the last one; pause freezes the transition. Each pitch is independent. Reduced-motion preference removes interpolation. Single-frame historical answers stay static with an explicit label.

Dify instructions request 2–3 compact frames for movement explanations, stable IDs and short Arabic commentary, without claiming real tracking or inventing a sequence unsupported by evidence.

The review page uses an authored generic four-player example, disabled in Production. Tests cover interpolation, identity changes, input immutability, navigation bounds, Arabic controls and static compatibility. Run node --test tests/*.cjs.
