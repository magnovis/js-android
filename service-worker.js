// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var dataCacheName = 'weatherData-v1';
var cacheName = 'weatherPWA-final-1';
var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  'https://cdn.rawgit.com/magnovis/js-android/dcef8325/inline.css',
  'https://4.bp.blogspot.com/-v3K9D19NBik/Wi9yMAqWgHI/AAAAAAAAlHs/49ww6pnwmccKIfwgBaEWDHRc_zLO3n7wQCLcBGAs/s1600/clear.png',
  'https://3.bp.blogspot.com/-M_UgUXlcBlg/Wi9yMFOpDCI/AAAAAAAAlHw/0J4lv21H3yIsuIGf1iXplIbRUVl-qqtewCLcBGAs/s1600/cloudy-scattered-showers.png',
  'https://3.bp.blogspot.com/-wM8pH0F5qfc/Wi9yMN8cLhI/AAAAAAAAlH0/V5mW1lz5RyMegVEN-mKTJRg3E-muYY4SQCLcBGAs/s1600/cloudy.png',
  'https://3.bp.blogspot.com/-SDqG5QEQ1ME/Wi9yNZfcVcI/AAAAAAAAlH8/O3bj4CIebM4NlwHKSXEfHKRARGZ368XKACLcBGAs/s1600/fog.png',
  'https://cdn.rawgit.com/magnovis/js-android/4eaaa37c/ic_add_white_24px.svg',
  'https://cdn.rawgit.com/magnovis/js-android/4eaaa37c/ic_refresh_white_24px.svg',
  'https://3.bp.blogspot.com/-vLXAavhu6iE/Wi9yOUkXwII/AAAAAAAAlIE/oxaajqyroMQIp1hy9dHezcmiyaOGIZrCgCLcBGAs/s1600/partly-cloudy.png',
  'https://4.bp.blogspot.com/-WlDf-pn8NYk/Wi9yOd8ciRI/AAAAAAAAlIA/qJF9B6DFXUYnCY-WCmRwEiiQG0kBlwS2wCLcBGAs/s1600/rain.png',
  'https://1.bp.blogspot.com/-9J6WvicJZOo/Wi9yOvYfAXI/AAAAAAAAlII/qWPwbVwetCEOj8ZYcmsmrZwaeJAihnsNgCLcBGAs/s1600/scattered-showers.png',
  'https://2.bp.blogspot.com/-LErYuWIgatY/Wi9yPZx3HwI/AAAAAAAAlIM/SrEN1-kqmLQoPPz74jRGc0lgRTuXD6bkwCLcBGAs/s1600/sleet.png',
  'https://4.bp.blogspot.com/-BVPqgeoLKu4/Wi9yPOSRlnI/AAAAAAAAlIQ/PchyRHshJWEQmPsDzm6Ez8vWKEEeiJWrgCLcBGAs/s1600/snow.png',
  'https://1.bp.blogspot.com/-V4GVGD0lCFQ/Wi9yPvSNkpI/AAAAAAAAlIU/AqgZMcGhroY-82XMX4rhF3vSH1SqK48JgCLcBGAs/s1600/thunderstorm.png',
  'https://2.bp.blogspot.com/-mFP8ViXA034/Wi9yQpsVL_I/AAAAAAAAlIY/wF-0hXHKrycvH02kMRQQI3-by7Z_pZDZgCLcBGAs/s1600/wind.png'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
