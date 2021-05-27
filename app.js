/* eslint-disable max-len */
import discord from 'discord.js';
import {discordToken, googleToken, openweatherToken} from './sensitive-infos.js';
import fetch from 'node-fetch';
import nodeHtmlToImage from 'node-html-to-image';
import jsdom from 'jsdom';
const {JSDOM} = jsdom;
import fs from 'fs';


// Define Discord client

const client = new discord.Client;

// Ready notify

client.on('ready', () => {
  console.log(`✅ Bot actived as ${client.user.tag} :3`);
});

client.on('message', async (msg)=>{
  if (msg.content.startsWith('-날씨 ')) {
    const address = msg.content.substring(4, msg.content.length);
    const getCoordinateInfo = (address) => {
      return fetch(encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${googleToken}`));
    };
    // eslint-disable-next-line no-var
    var weatherInfo = 'not changed';
    const deriveWeatherInfo= async () => {
      const locationJson = await (await getCoordinateInfo(address)).json();
      const locationAxis = await locationJson.results[0].geometry.location;
      const weatherRes = await fetch(encodeURI(`https://api.openweathermap.org/data/2.5/weather?lang=kr&lat=${locationAxis.lat}&lon=${locationAxis.lng}&appid=${openweatherToken}`));
      const weatherJson = await weatherRes.json();
      return weatherInfo = weatherJson;
    };
    deriveWeatherInfo().then((response) => {
      generateWeatherImage(weatherInfo);
    });
    // imageCode, location, weatherDes, temp, precipitation, humidity
    const generateWeatherImage = async (weatherInfo) => {
      const weatherInfoObj = {
        'imageCode': weatherInfo.weather[0].icon,
        'location': address,
        'weatherDes': weatherInfo.weather[0].description,
        'temp': weatherInfo.main.temp - 273,
        'windSpeed': weatherInfo.wind.speed,
        'humidity': weatherInfo.main.humidity,
      };
      const imageHtml = fs.readFileSync('weather-image.html', 'utf-8');

      const dom = new JSDOM(imageHtml);
      const document = dom.window.document;

      const fiilInInfosToHtml = (weatherInfoObj) => {
        console.log(weatherInfoObj);
        // set icon src
        document.querySelector('.container__icon-container__icon').outerHTML = `<img class="container__icon-container__icon" src="http://openweathermap.org/img/wn/${weatherInfoObj.imageCode}@4x.png">`;
        // set location text
        document.querySelector('.title__address').innerHTML = weatherInfoObj.location;
        // set description text
        document.querySelector('.title__weatherDes').innerHTML = weatherInfoObj.weatherDes;
        // set temp text
        document.querySelector('.detail__info-box__info-value').innerHTML = weatherInfoObj.temp+'°C';
        // set precipitation text
        document.querySelector('.detail__info-box__info-value').innerHTMLdd = weatherInfoObj.windSpeed+'m/s';
        // set humidity text
        document.querySelector('.detail__info-box__info-value').innerHTML = weatherInfoObj.humidity+'%';
        return document;
      };
      const imageHtmlRef = fiilInInfosToHtml(weatherInfoObj);
      const htmlMarkups = imageHtmlRef.querySelector('html').innerHTML;
      let image = await nodeHtmlToImage({
        html: htmlMarkups,
      });
      image = new discord.MessageAttachment(image, 'weather.png');
      msg.channel.send({files: [image]});
    };
  }
});

client.login(discordToken);
