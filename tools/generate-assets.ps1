Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$persodonDir = Join-Path $root "assets\sprites\persodons"
$locationDir = Join-Path $root "assets\sprites\locations"
$playerDir = Join-Path $root "assets\sprites\player"
$tilesetDir = Join-Path $root "assets\tilesets"

New-Item -ItemType Directory -Force $persodonDir, $locationDir, $playerDir, $tilesetDir | Out-Null

function Color($hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function New-PixelBitmap($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap -ArgumentList $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  return @{ Bitmap = $bmp; Graphics = $g }
}

function Rect($g, $hex, $x, $y, $w, $h) {
  $brush = New-Object System.Drawing.SolidBrush (Color $hex)
  $g.FillRectangle($brush, $x, $y, $w, $h)
  $brush.Dispose()
}

function Save-Bitmap($bmp, $path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Slug($name) {
  return ($name.ToLowerInvariant() -replace "[^a-z0-9]+", "-" -replace "^-|-$", "")
}

function Draw-BaseCreature($g, $main, $light, $dark, $accent, $shape) {
  $outline = "#1a1a2e"
  $skin = "#f0b878"
  $skinLight = "#ffd098"
  $skinDark = "#b87038"
  $hair = "#303038"

  # Human/chibi base: readable at 64x64 and close to the protagonist concept scale.
  Rect $g "#00000033" 12 59 40 3

  # Arms behind torso.
  Rect $g $outline 10 31 9 21
  Rect $g $outline 45 31 9 21
  Rect $g $dark 12 33 6 15
  Rect $g $dark 46 33 6 15
  Rect $g $skinDark 11 48 8 5
  Rect $g $skinDark 45 48 8 5
  Rect $g $skin 12 47 6 5
  Rect $g $skin 46 47 6 5

  # Legs and feet.
  Rect $g $outline 21 48 9 12
  Rect $g $outline 34 48 9 12
  Rect $g $dark 23 49 6 9
  Rect $g $dark 35 49 6 9
  Rect $g $outline 18 57 13 4
  Rect $g $outline 34 57 13 4
  Rect $g "#f8f8f8" 21 57 8 2
  Rect $g "#f8f8f8" 36 57 8 2

  # Torso, shoulders and costume.
  Rect $g $outline 14 29 36 22
  Rect $g $dark 16 31 32 19
  Rect $g $main 18 32 28 16
  Rect $g $light 23 34 18 5
  Rect $g $accent 24 43 16 4
  Rect $g $outline 29 32 6 18
  Rect $g $accent 30 34 4 13

  # Head, ears, hair and face.
  Rect $g $outline 17 9 30 23
  Rect $g $hair 19 7 26 11
  Rect $g $hair 17 13 30 7
  Rect $g $skinDark 15 20 5 8
  Rect $g $skinDark 44 20 5 8
  Rect $g $skin 20 16 24 16
  Rect $g $skinLight 22 17 20 8
  Rect $g $hair 20 12 8 4
  Rect $g $hair 36 12 7 4
  Rect $g $outline 24 23 4 4
  Rect $g $outline 36 23 4 4
  Rect $g "#f8f8f8" 25 23 2 2
  Rect $g "#f8f8f8" 37 23 2 2
  Rect $g $skinDark 30 28 4 2

  switch ($shape) {
    "podium" {
      Rect $g $outline 20 4 24 6
      Rect $g $accent 22 3 20 6
      Rect $g $outline 13 44 38 10
      Rect $g $light 16 43 32 8
      Rect $g $accent 28 44 8 7
      Rect $g $outline 25 34 4 4
      Rect $g $outline 35 34 4 4
    }
    "star" {
      Rect $g $outline 28 2 8 11
      Rect $g $outline 7 27 12 8
      Rect $g $outline 45 27 12 8
      Rect $g $accent 30 3 4 10
      Rect $g $accent 9 29 10 4
      Rect $g $accent 45 29 10 4
      Rect $g $light 26 39 12 9
      Rect $g $outline 28 41 8 5
      Rect $g $accent 30 40 4 8
    }
    "pyramid" {
      Rect $g $outline 24 2 16 8
      Rect $g $outline 20 8 24 6
      Rect $g $accent 26 3 12 6
      Rect $g $accent 22 9 20 4
      Rect $g $outline 18 39 28 8
      Rect $g $main 20 38 24 8
      Rect $g $light 26 40 12 4
      Rect $g $accent 30 18 4 8
    }
    "screen" {
      Rect $g $outline 19 20 26 8
      Rect $g $dark 21 21 10 5
      Rect $g $dark 34 21 10 5
      Rect $g $accent 31 23 3 2
      Rect $g $outline 10 30 8 13
      Rect $g $outline 46 30 8 13
      Rect $g $main 11 31 6 10
      Rect $g $main 47 31 6 10
      Rect $g $light 23 34 18 4
    }
    "hat" {
      Rect $g $outline 8 11 48 8
      Rect $g $dark 10 10 44 7
      Rect $g $outline 20 4 24 10
      Rect $g $main 22 3 20 10
      Rect $g $accent 23 13 18 3
      Rect $g $light 24 37 16 5
      Rect $g $accent 13 34 5 11
      Rect $g $accent 46 34 5 11
    }
    "parka" {
      Rect $g $outline 14 7 36 29
      Rect $g $dark 16 8 32 27
      Rect $g $main 18 10 28 24
      Rect $g "#f8f8f8" 20 13 24 17
      Rect $g $skin 23 16 18 13
      Rect $g $outline 25 22 4 4
      Rect $g $outline 35 22 4 4
      Rect $g $accent 18 45 28 4
    }
    "music" {
      Rect $g $outline 10 20 9 21
      Rect $g $outline 45 20 9 21
      Rect $g $accent 12 22 7 17
      Rect $g $accent 45 22 7 17
      Rect $g $outline 39 4 8 23
      Rect $g $accent 41 5 4 18
      Rect $g $accent 37 22 10 5
      Rect $g $light 25 35 14 4
    }
    "badge" {
      Rect $g $outline 25 3 14 10
      Rect $g $accent 27 2 10 10
      Rect $g $outline 18 35 28 12
      Rect $g $accent 20 34 24 12
      Rect $g $main 24 37 16 6
      Rect $g $light 29 38 6 4
    }
    "globe" {
      Rect $g $outline 14 7 36 26
      Rect $g $main 16 8 32 24
      Rect $g $light 21 13 22 8
      Rect $g $accent 18 24 28 4
      Rect $g $skin 24 16 16 10
      Rect $g $outline 29 49 6 9
      Rect $g $accent 19 34 26 4
    }
    default {
      Rect $g $outline 8 31 11 10
      Rect $g $outline 45 31 11 10
      Rect $g $accent 10 32 8 7
      Rect $g $accent 46 32 8 7
      Rect $g $light 25 36 14 5
    }
  }
}

function Draw-KanyeWestSprite($g) {
  $outline = "#1a1a2e"
  $skin = "#8a4f2a"
  $skinLight = "#b87038"
  $skinDark = "#5a2f1d"
  $black = "#202028"
  $blackLight = "#383840"
  $gold = "#f8d030"
  $white = "#f8f8f8"
  $purple = "#705898"

  Rect $g "#00000033" 9 59 46 3

  # Stage aura and mythic silhouette accents.
  Rect $g $gold 30 2 4 10
  Rect $g $gold 10 28 10 4
  Rect $g $gold 44 28 10 4
  Rect $g $purple 8 33 7 3
  Rect $g $purple 49 33 7 3

  # Dark boots and legs.
  Rect $g $outline 20 48 10 12
  Rect $g $outline 34 48 10 12
  Rect $g $black 22 49 7 9
  Rect $g $black 35 49 7 9
  Rect $g $outline 17 57 14 4
  Rect $g $outline 34 57 14 4
  Rect $g $white 20 57 9 2
  Rect $g $white 37 57 8 2

  # Oversized dark jacket / hoodie.
  Rect $g $outline 9 29 12 22
  Rect $g $outline 43 29 12 22
  Rect $g $blackLight 11 31 8 17
  Rect $g $blackLight 45 31 8 17
  Rect $g $skinDark 10 48 9 5
  Rect $g $skinDark 45 48 9 5
  Rect $g $outline 14 28 36 23
  Rect $g $black 16 30 32 20
  Rect $g $blackLight 18 32 28 7
  Rect $g "#101018" 23 39 18 10
  Rect $g $white 29 31 6 18

  # Gold chain and pendant.
  Rect $g $gold 24 37 4 3
  Rect $g $gold 36 37 4 3
  Rect $g $gold 27 40 10 3
  Rect $g $gold 30 43 4 4

  # Head, close-cropped hair, beard and sunglasses.
  Rect $g $outline 17 9 30 24
  Rect $g "#101018" 19 7 26 9
  Rect $g "#101018" 17 13 30 5
  Rect $g $skinDark 15 20 5 9
  Rect $g $skinDark 44 20 5 9
  Rect $g $skin 20 16 24 17
  Rect $g $skinLight 22 17 20 7
  Rect $g $skinDark 21 28 22 5
  Rect $g "#101018" 21 21 22 7
  Rect $g "#303038" 23 22 8 4
  Rect $g "#303038" 34 22 8 4
  Rect $g $white 25 22 3 1
  Rect $g $white 36 22 3 1
  Rect $g $skinDark 30 31 4 2
  Rect $g $outline 29 34 6 2

  # Handheld mic to sell the music/mythic identity.
  Rect $g $outline 49 36 5 12
  Rect $g "#707070" 50 36 3 8
  Rect $g $gold 48 33 7 5
}

$persodons = @(
  @{ Id=1; Name="Ovalid"; Main="#d8d8d8"; Light="#f8f8f8"; Dark="#707070"; Accent="#e03228"; Shape="podium" },
  @{ Id=2; Name="Resolutor"; Main="#b8b8d0"; Light="#f8f8f8"; Dark="#484858"; Accent="#4090f0"; Shape="podium" },
  @{ Id=3; Name="MountRushmo"; Main="#b8a038"; Light="#e0c068"; Dark="#705848"; Accent="#f8d030"; Shape="podium" },
  @{ Id=4; Name="Filibustor"; Main="#a8a878"; Light="#f0e8c8"; Dark="#705848"; Accent="#f87830"; Shape="screen" },
  @{ Id=5; Name="Vetozer"; Main="#705898"; Light="#a890f0"; Dark="#1a1a2e"; Accent="#e03228"; Shape="screen" },
  @{ Id=6; Name="Paparazzit"; Main="#484848"; Light="#f8f8f8"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="screen" },
  @{ Id=7; Name="Flashique"; Main="#f85888"; Light="#f8d8e8"; Dark="#a040a0"; Accent="#f8d030"; Shape="star" },
  @{ Id=8; Name="Boxofficon"; Main="#707070"; Light="#d8d8d8"; Dark="#383838"; Accent="#e03228"; Shape="screen" },
  @{ Id=9; Name="Popstarlet"; Main="#f85888"; Light="#f8f8f8"; Dark="#705898"; Accent="#4890f8"; Shape="music" },
  @{ Id=10; Name="Trendiva"; Main="#a890f0"; Light="#f8d8e8"; Dark="#705898"; Accent="#40b840"; Shape="star" },
  @{ Id=11; Name="Pamphletor"; Main="#f0e8c8"; Light="#f8f8f8"; Dark="#a8a878"; Accent="#a040a0"; Shape="podium" },
  @{ Id=12; Name="Megaphrophet"; Main="#f87830"; Light="#f8d030"; Dark="#c03028"; Accent="#f8f8f8"; Shape="music" },
  @{ Id=13; Name="Compoundra"; Main="#705848"; Light="#a8a878"; Dark="#383838"; Accent="#a040a0"; Shape="podium" },
  @{ Id=14; Name="Televangelux"; Main="#4090f0"; Light="#98d8d8"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="screen" },
  @{ Id=15; Name="Cowboil"; Main="#705848"; Light="#e0c068"; Dark="#383838"; Accent="#f08030"; Shape="hat" },
  @{ Id=16; Name="Drillhorn"; Main="#705848"; Light="#d8b878"; Dark="#383838"; Accent="#f87830"; Shape="pyramid" },
  @{ Id=17; Name="Rodeon"; Main="#c8a868"; Light="#f0e8c8"; Dark="#705848"; Accent="#e03228"; Shape="hat" },
  @{ Id=18; Name="LoneStario"; Main="#4090f0"; Light="#f8f8f8"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="badge" },
  @{ Id=19; Name="Parkaprep"; Main="#98d8d8"; Light="#f8f8f8"; Dark="#4878e0"; Accent="#f8d030"; Shape="parka" },
  @{ Id=20; Name="Frostprepper"; Main="#6890f0"; Light="#d8f8f8"; Dark="#383878"; Accent="#f8f8f8"; Shape="parka" },
  @{ Id=21; Name="Auroraudit"; Main="#40b840"; Light="#98d8d8"; Dark="#387850"; Accent="#f8d030"; Shape="star" },
  @{ Id=22; Name="Snowblindr"; Main="#d8f8f8"; Light="#f8f8f8"; Dark="#6890f0"; Accent="#705898"; Shape="screen" },
  @{ Id=23; Name="Pyramidion"; Main="#b8a038"; Light="#f8d030"; Dark="#705848"; Accent="#a040a0"; Shape="pyramid" },
  @{ Id=24; Name="HandshakeX"; Main="#705898"; Light="#a890f0"; Dark="#1a1a2e"; Accent="#f0e8c8"; Shape="default" },
  @{ Id=25; Name="Globallure"; Main="#4890f8"; Light="#98d8d8"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="globe" },
  @{ Id=26; Name="Backroomini"; Main="#a8a878"; Light="#f0e8c8"; Dark="#705848"; Accent="#705898"; Shape="podium" },
  @{ Id=27; Name="Stanlet"; Main="#f8d030"; Light="#f8f8f8"; Dark="#705848"; Accent="#4890f8"; Shape="music" },
  @{ Id=28; Name="Hypebeato"; Main="#f87830"; Light="#f8d030"; Dark="#1a1a2e"; Accent="#f85888"; Shape="music" },
  @{ Id=29; Name="Kanye West"; Main="#f8d030"; Light="#f8f8f8"; Dark="#1a1a2e"; Accent="#705898"; Shape="star" },
  @{ Id=30; Name="Ballotad"; Main="#d8d8d8"; Light="#f8f8f8"; Dark="#707070"; Accent="#4090f0"; Shape="podium" },
  @{ Id=31; Name="Pollstergeist"; Main="#705898"; Light="#a890f0"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="screen" },
  @{ Id=32; Name="Clipling"; Main="#f85888"; Light="#f8f8f8"; Dark="#705898"; Accent="#4890f8"; Shape="screen" },
  @{ Id=33; Name="Cloutgeist"; Main="#a040a0"; Light="#f8d8e8"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="star" },
  @{ Id=34; Name="Sermonette"; Main="#f0e8c8"; Light="#f8f8f8"; Dark="#705848"; Accent="#a040a0"; Shape="music" },
  @{ Id=35; Name="Revivalux"; Main="#f87830"; Light="#f8d030"; Dark="#c03028"; Accent="#f8f8f8"; Shape="badge" },
  @{ Id=36; Name="Oiligarch"; Main="#383838"; Light="#705848"; Dark="#1a1a2e"; Accent="#f87830"; Shape="hat" },
  @{ Id=37; Name="Snowcache"; Main="#d8f8f8"; Light="#f8f8f8"; Dark="#6890f0"; Accent="#f8d030"; Shape="parka" },
  @{ Id=38; Name="CabinSignal"; Main="#98d8d8"; Light="#f8f8f8"; Dark="#4878e0"; Accent="#705898"; Shape="screen" },
  @{ Id=39; Name="Bridgebrite"; Main="#e8d070"; Light="#f8f8f8"; Dark="#705848"; Accent="#4090f0"; Shape="podium" },
  @{ Id=40; Name="Eyeconic"; Main="#b8a038"; Light="#f8d030"; Dark="#705848"; Accent="#705898"; Shape="pyramid" },
  @{ Id=41; Name="Archiveache"; Main="#707070"; Light="#d8d8d8"; Dark="#1a1a2e"; Accent="#f8d030"; Shape="globe" },
  @{ Id=42; Name="Mixtapeon"; Main="#f8d030"; Light="#f8f8f8"; Dark="#705848"; Accent="#f85888"; Shape="music" }
)

foreach ($p in $persodons) {
  if ($p.Id -eq 29) {
    $ctx = New-PixelBitmap 120 120
    $small = New-PixelBitmap 64 64
    Draw-KanyeWestSprite $small.Graphics
    $ctx.Graphics.DrawImage($small.Bitmap, 0, 0, 120, 120)
    $small.Graphics.Dispose()
    $small.Bitmap.Dispose()
  } else {
    $ctx = New-PixelBitmap 64 64
    Draw-BaseCreature $ctx.Graphics $p.Main $p.Light $p.Dark $p.Accent $p.Shape
  }
  $safeId = "{0:D3}" -f $p.Id
  Save-Bitmap $ctx.Bitmap (Join-Path $persodonDir "$safeId-$(Slug $p.Name).png")
  $ctx.Graphics.Dispose()
  $ctx.Bitmap.Dispose()
}

$persodonFiles = Get-ChildItem $persodonDir -Filter "*.png" | Where-Object { $_.Name -ne "persodon-sheet.png" } | Sort-Object Name
$persodonRows = [math]::Ceiling($persodonFiles.Count / 8)
$sheet = New-PixelBitmap 512 ($persodonRows * 64)
$i = 0
$persodonFiles | ForEach-Object {
  $img = [System.Drawing.Bitmap]::FromFile($_.FullName)
  $x = ($i % 8) * 64
  $y = [math]::Floor($i / 8) * 64
  $sheet.Graphics.DrawImage($img, $x, $y, 64, 64)
  $img.Dispose()
  $i++
}
Save-Bitmap $sheet.Bitmap (Join-Path $persodonDir "persodon-sheet.png")
$sheet.Graphics.Dispose()
$sheet.Bitmap.Dispose()

function Draw-Building($path, $base, $roof, $accent, $kind) {
  $ctx = New-PixelBitmap 64 64
  $g = $ctx.Graphics
  Rect $g "#00000033" 8 56 48 4
  Rect $g $base 12 24 40 32
  Rect $g $roof 8 16 48 12
  Rect $g "#1a1a2e" 12 24 40 3
  Rect $g "#f0e8c8" 18 34 10 10
  Rect $g "#f0e8c8" 36 34 10 10
  Rect $g $accent 28 43 8 13
  switch ($kind) {
    "stage" {
      Rect $g $accent 10 12 44 6
      Rect $g "#1a1a2e" 14 20 4 36
      Rect $g "#1a1a2e" 46 20 4 36
    }
    "park" {
      Rect $g "#78c850" 4 44 56 12
      Rect $g "#40b840" 8 28 12 20
      Rect $g "#40b840" 44 28 12 20
    }
    "oil" {
      Rect $g "#705848" 16 8 4 48
      Rect $g "#705848" 44 8 4 48
      Rect $g "#f87830" 22 14 20 6
    }
    "metro" {
      Rect $g $base 8 10 12 46
      Rect $g $base 44 8 12 48
      Rect $g "#f8d030" 12 16 4 4
      Rect $g "#f8d030" 48 18 4 4
    }
    "island" {
      Rect $g "#6890f0" 0 50 64 14
      Rect $g "#e8d070" 8 44 48 8
      Rect $g "#705898" 24 20 16 20
    }
    "gym" {
      Rect $g "#e03228" 22 8 20 10
      Rect $g "#f8f8f8" 28 10 8 6
    }
  }
  Save-Bitmap $ctx.Bitmap $path
  $g.Dispose()
  $ctx.Bitmap.Dispose()
}

$locations = @(
  @{ Name="votuporanga-home"; Base="#f0e8c8"; Roof="#e03228"; Accent="#4090f0"; Kind="home" },
  @{ Name="lab-ipe"; Base="#d8d8d8"; Roof="#78c850"; Accent="#4090f0"; Kind="lab" },
  @{ Name="praca-matriz"; Base="#f0e8c8"; Roof="#b8b8d0"; Accent="#f8d030"; Kind="park" },
  @{ Name="concha-acustica"; Base="#d8b878"; Roof="#e03228"; Accent="#f8d030"; Kind="stage" },
  @{ Name="parque-cultura"; Base="#f0e8c8"; Roof="#78c850"; Accent="#f85888"; Kind="park" },
  @{ Name="horto-florestal"; Base="#78c850"; Roof="#40b840"; Accent="#705848"; Kind="park" },
  @{ Name="rodoviaria"; Base="#d8d8d8"; Roof="#4090f0"; Accent="#f8d030"; Kind="metro" },
  @{ Name="texas-refinaria"; Base="#c8a868"; Roof="#705848"; Accent="#f87830"; Kind="oil" },
  @{ Name="rancho-eco"; Base="#d8b878"; Roof="#705848"; Accent="#f8d030"; Kind="home" },
  @{ Name="mercado-ponte"; Base="#e8d070"; Roof="#f87830"; Accent="#4090f0"; Kind="stage" },
  @{ Name="fronteira-posto"; Base="#d8d8d8"; Roof="#e03228"; Accent="#4090f0"; Kind="metro" },
  @{ Name="studio-24h"; Base="#707070"; Roof="#1a1a2e"; Accent="#f85888"; Kind="metro" },
  @{ Name="metro-praca"; Base="#b8b8d0"; Roof="#4090f0"; Accent="#f8d030"; Kind="metro" },
  @{ Name="ilha-tein-doca"; Base="#e8d070"; Roof="#705848"; Accent="#6890f0"; Kind="island" },
  @{ Name="arquivo-subterraneo"; Base="#707070"; Roof="#1a1a2e"; Accent="#705898"; Kind="gym" },
  @{ Name="palco-eclipse"; Base="#705898"; Roof="#1a1a2e"; Accent="#f8d030"; Kind="stage" }
)

foreach ($loc in $locations) {
  Draw-Building (Join-Path $locationDir "$($loc.Name).png") $loc.Base $loc.Roof $loc.Accent $loc.Kind
}

$gyms = @(
  @{ Name="gym-01-concha"; Base="#d8b878"; Roof="#e03228"; Accent="#f8d030" },
  @{ Name="gym-02-cultura"; Base="#f0e8c8"; Roof="#78c850"; Accent="#f85888" },
  @{ Name="gym-03-oleo"; Base="#c8a868"; Roof="#705848"; Accent="#f87830" },
  @{ Name="gym-04-ponte"; Base="#e8d070"; Roof="#f87830"; Accent="#4090f0" },
  @{ Name="gym-05-primetime"; Base="#707070"; Roof="#1a1a2e"; Accent="#f85888" },
  @{ Name="gym-06-sigilo"; Base="#707070"; Roof="#705898"; Accent="#f8d030" },
  @{ Name="gym-07-era"; Base="#1a1a2e"; Roof="#f8d030"; Accent="#705898" }
)

foreach ($gym in $gyms) {
  Draw-Building (Join-Path $locationDir "$($gym.Name).png") $gym.Base $gym.Roof $gym.Accent "gym"
}

$locationFiles = Get-ChildItem $locationDir -Filter "*.png" | Where-Object { $_.Name -ne "location-sheet.png" } | Sort-Object Name
$locationRows = [math]::Ceiling($locationFiles.Count / 8)
$locationSheet = New-PixelBitmap 512 ($locationRows * 64)
$i = 0
$locationFiles | ForEach-Object {
  $img = [System.Drawing.Bitmap]::FromFile($_.FullName)
  $x = ($i % 8) * 64
  $y = [math]::Floor($i / 8) * 64
  $locationSheet.Graphics.DrawImage($img, $x, $y, 64, 64)
  $img.Dispose()
  $i++
}
Save-Bitmap $locationSheet.Bitmap (Join-Path $locationDir "location-sheet.png")
$locationSheet.Graphics.Dispose()
$locationSheet.Bitmap.Dispose()

function Draw-Tile($g, $x, $y, $base, $accent, $kind) {
  Rect $g $base $x $y 16 16
  switch ($kind) {
    "grass" {
      Rect $g $accent ($x+2) ($y+4) 2 4
      Rect $g $accent ($x+9) ($y+8) 2 4
      Rect $g "#40b840" ($x+13) ($y+3) 2 3
    }
    "tall" {
      for ($i=0; $i -lt 8; $i++) { Rect $g $accent ($x+$i*2) ($y+6-($i%2)*2) 2 8 }
    }
    "water" {
      Rect $g "#98d8d8" ($x+1) ($y+5) 6 2
      Rect $g "#98d8d8" ($x+9) ($y+10) 5 2
    }
    "road" {
      Rect $g $accent ($x+0) ($y+7) 16 2
    }
    "wall" {
      Rect $g $accent ($x+0) ($y+0) 16 2
      Rect $g $accent ($x+0) ($y+8) 16 2
      Rect $g $accent ($x+7) ($y+0) 2 16
    }
    "tree" {
      Rect $g "#705848" ($x+7) ($y+8) 3 8
      Rect $g "#40b840" ($x+3) ($y+2) 10 8
    }
    "sign" {
      Rect $g "#705848" ($x+7) ($y+9) 2 7
      Rect $g $accent ($x+3) ($y+3) 10 6
    }
  }
}

$tiles = New-PixelBitmap 128 64
$tileDefs = @(
  @{ Base="#78c850"; Accent="#60b040"; Kind="grass" },
  @{ Base="#68d040"; Accent="#40b840"; Kind="tall" },
  @{ Base="#d8b878"; Accent="#c8a868"; Kind="road" },
  @{ Base="#6890f0"; Accent="#4878e0"; Kind="water" },
  @{ Base="#e8d070"; Accent="#d8c060"; Kind="road" },
  @{ Base="#705848"; Accent="#604838"; Kind="wall" },
  @{ Base="#707070"; Accent="#484848"; Kind="road" },
  @{ Base="#d0c8b8"; Accent="#c0b8a8"; Kind="wall" },
  @{ Base="#78c850"; Accent="#40b840"; Kind="tree" },
  @{ Base="#d8b878"; Accent="#705848"; Kind="sign" },
  @{ Base="#c8a868"; Accent="#705848"; Kind="road" },
  @{ Base="#d8f8f8"; Accent="#98d8d8"; Kind="road" },
  @{ Base="#b8b8d0"; Accent="#707070"; Kind="wall" },
  @{ Base="#1a1a2e"; Accent="#705898"; Kind="wall" },
  @{ Base="#f0e8c8"; Accent="#e03228"; Kind="sign" },
  @{ Base="#f8d030"; Accent="#f87830"; Kind="road" }
)
for ($i=0; $i -lt $tileDefs.Count; $i++) {
  $x = ($i % 8) * 16
  $y = [math]::Floor($i / 8) * 16
  Draw-Tile $tiles.Graphics $x $y $tileDefs[$i].Base $tileDefs[$i].Accent $tileDefs[$i].Kind
}
Save-Bitmap $tiles.Bitmap (Join-Path $tilesetDir "overworld-tiles.png")
$tiles.Graphics.Dispose()
$tiles.Bitmap.Dispose()

$existingPlayer = Join-Path $root "assets\concepts\matheus-benevides-sprite-64-transparent.png"
if (Test-Path $existingPlayer) {
  Copy-Item -LiteralPath $existingPlayer -Destination (Join-Path $playerDir "matheus-benevides.png") -Force
}

$manifest = [ordered]@{
  game = "KirkDon"
  persodonCount = $persodons.Count
  locationCount = $locations.Count
  gymCount = $gyms.Count
  generatedAt = (Get-Date).ToString("s")
} | ConvertTo-Json
$manifest | Set-Content -Encoding ASCII (Join-Path $root "assets\manifest.json")

Write-Output "Generated $($persodons.Count) Persodon sprites, $($locations.Count) location sprites, $($gyms.Count) gym sprites, and overworld tileset."
