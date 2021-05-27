/* eslint-disable no-var */
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

// Response at -날씨

client.on('message', async (msg)=>{
  if (msg.content.startsWith('-날씨 ')) {
    // Extract address

    const address = msg.content.substring(4, msg.content.length);

    // Get coordinate API response

    const getCoordinateInfo = (address) => {
      return fetch(encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${googleToken}`));
    };

    var weatherInfo = undefined;

    const deriveWeatherInfo= async () => {
      // Parsing JSON

      const locationJson = await (await getCoordinateInfo(address)).json();
      const locationAxis = await locationJson.results[0].geometry.location;

      // Request weatherInfo and Parse JSON

      const weatherRes = await fetch(encodeURI(`https://api.openweathermap.org/data/2.5/weather?lang=kr&lat=${locationAxis.lat}&lon=${locationAxis.lng}&appid=${openweatherToken}`));
      const weatherJson = await weatherRes.json();

      // Save JSON

      weatherInfo = weatherJson;
    };

    // make new func (to use Async func)
    deriveWeatherInfo().then((response) => {
      generateWeatherImage(weatherInfo);
    });

    // Convert JSON to weatherInfoObj (imageCode, location, weatherDes, temp, windSpeed, humidity)
    const generateWeatherImage = async (weatherInfo) => {
      const weatherInfoObj = {
        'imageCode': weatherInfo.weather[0].icon,
        'location': address,
        'weatherDes': weatherInfo.weather[0].description,
        'temp': weatherInfo.main.temp - 273,
        'windSpeed': weatherInfo.wind.speed,
        'humidity': weatherInfo.main.humidity,
      };

      // Import html

      const imageHtml = fs.readFileSync('weather-image.html', 'utf-8');

      // Generate DOM & Document

      const dom = new JSDOM(imageHtml);
      const document = dom.window.document;

      // Put weather infos to HTML elements

      const fiilInInfosToHtml = (weatherInfoObj) => {
        // set icon src
        document.querySelector('.container__icon-container__icon').outerHTML = `<img class="container__icon-container__icon" src="http://openweathermap.org/img/wn/${weatherInfoObj.imageCode}@4x.png">`;
        // set location text
        document.querySelector('.title__address').innerHTML = weatherInfoObj.location;
        // set description text
        document.querySelector('.title__weatherDes').innerHTML = weatherInfoObj.weatherDes;
        // set temp text
        document.querySelector('.temp').innerHTML = Math.round(weatherInfoObj.temp)+'°C';
        // set precipitation text
        document.querySelector('.wind-speed').innerHTML = weatherInfoObj.windSpeed+'m/s';
        // set humidity text
        document.querySelector('.humidity').innerHTML = weatherInfoObj.humidity+'%';
        return document;
      };

      // Get innerHTML of Document

      const imageHtmlRef = fiilInInfosToHtml(weatherInfoObj);
      const htmlMarkups = imageHtmlRef.querySelector('html').innerHTML;

      // Convert HTML to an Image

      let image = await nodeHtmlToImage({
        html: htmlMarkups,
      });
      image = new discord.MessageAttachment(image, 'weather.png');
      msg.channel.send({files: [image]});
    };
  }
});

client.login(discordToken);
