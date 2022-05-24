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

let map, mapE;

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(position, latitude, longitude);

      const coords = [latitude, longitude];

      map = L.map("map").setView(coords, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        id: "mapbox/streets-v11",
      }).addTo(map);
      L.marker(coords).addTo(map).bindPopup("Your location").openPopup();

      map.on("click", function (e) {
        mapE = e;
        form.classList.remove("hidden");
        inputDistance.focus();
      });
    },
    (error) => {
      alert(error.message);
    }
  );
}

let markerCount = 0;

form.addEventListener("submit", (e) => {
  e.preventDefault()
  markerCount++;
  const { lat, lng } = mapE.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        autoClose: false,
        closeOnClick: false,
        className: "running-popup",
      })
    )
    .setPopupContent(`Workout ${markerCount}`)
    .openPopup();
});

inputType.addEventListener("change", function (e) {
  e.preventDefault()
  inputElevation
    .closest(".form__row")
    .classList.toggle("form__row--hidden");
  inputCadence
    .closest(".form__row")
    .classList.toggle("form__row--hidden");
});
