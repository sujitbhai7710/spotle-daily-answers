const fs = require('fs');
let content = fs.readFileSync('download/artists_data.js', 'utf8');
content = content.replace(/^const e=/, '').replace(/;\s*$/, '');
const data = JSON.parse(content);
console.log('Total artists:', data.length);

const artistInfo = {};
for (const a of data) {
  artistInfo[a.artist] = {
    artist: a.artist,
    country: a.country,
    genre: a.genre,
    gender: a.gender,
    group_size: a.group_size,
    debut_album_year: a.debut_album_year,
    spotify_uri: a.uri || '',
    image_uri: a.image_uri || '',
  };
}

fs.writeFileSync('download/artists_info.json', JSON.stringify(artistInfo, null, 2));
console.log('Saved', Object.keys(artistInfo).length, 'artists to artists_info.json');
console.log('The Who:', JSON.stringify(artistInfo['The Who'] || 'NOT FOUND'));
console.log('Steve Lacy:', JSON.stringify(artistInfo['Steve Lacy'] || 'NOT FOUND'));
