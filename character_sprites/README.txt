Add transparent PNG character templates here:

  pitcher.png
  catcher.png
  first_baseman.png
  infielder.png
  outfielder.png
  batter.png
  runner.png

Optional state sprites:
  batter_swing.png
  batter_out.png
  batter_walk.png
  runner_slide.png

Use these exact placeholder RGB colors in each template:
  Red     (255, 0, 0)     = team primary
  Green   (0, 255, 0)     = team secondary
  Blue    (0, 0, 255)     = accent/highlight
  Magenta (255, 0, 255)   = skin
  Cyan    (0, 255, 255)   = hair

All other pixels are preserved, so draw outlines, gloves, bats, shoes,
catcher gear, and facial details in their final colors.

The code automatically recolors, mirrors, scales, and caches sprites. Until
these PNG files are added, it falls back to the original procedural players.
