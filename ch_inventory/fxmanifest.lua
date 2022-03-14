fx_version 'cerulean'
game "gta5"

-- client_script {
--   "client/*.lua",
-- }

-- server_script {
--   "server/*.lua"
-- }

client_script {'@PolyZone/client.lua', '@PolyZone/ComboZone.lua', '@PolyZone/CircleZone.lua', 'dist/client/*.js', 'functions.lua', "exports.lua"}

server_script {'dist/server/*.js', 'exports_server.lua'}

ui_page "html/index.html"

files {
  "html/index.html",
  "html/main.js",
  "ItemData.json",
  "Stores.json",
  "CraftingStations.json"
}