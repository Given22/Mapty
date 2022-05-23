"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");


if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(position, latitude, longitude);

      const coords = [latitude, longitude];

      const map = L.map("map").setView(coords, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          id: 'mapbox/streets-v11',
          tileSize: 512,
          zoomOffset: -1,
      }).addTo(map);
      L.marker(coords).addTo(map).bindPopup("Your location").openPopup();
      
      let markerCount = 0;
      
      map.on('click', function(e) {
        markerCount++
        L.marker([e.latlng.lat, e.latlng.lng])
        .addTo(map)
        .bindPopup(L.popup({
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        }))
        .setPopupContent(`Workout ${markerCount}`)
        .openPopup();
      })
    },
    (error) => {
      alert(error.message);
    }
  );
}
