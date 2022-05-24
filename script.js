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

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration, type) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.type = type;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence, type) {
    super(coords, distance, duration, type);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    this.pace = this.pace || 0
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain, type) {
    super(coords, distance, duration, type);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    this.speed = this.speed || 0;
    return this.speed
  }
}

class App {
  #map;
  #mapE;
  #workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);
    
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this))
    
    this._getLocalStorage()
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        (error) => {
          alert(error.message);
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
    
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarkerOnStart(workout)
    })
  }

  _showForm(e) {
    this.#mapE = e;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _newWorkout() {
    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;

    let validInput = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    let positiveInput = (...inputs) => inputs.every((input) => input >= 0);

    if (!validInput(distance, duration) || !positiveInput(distance, duration)) {
      alert("Wrong input");
    } else {
      if (type === "running") {
        let cadence = +inputCadence.value;
        this.#workouts.push(
          new Running(this.#mapE.latlng, distance, duration, cadence, type)
        );
      } else {
        let elevationGain = +inputElevation.value;
        this.#workouts.push(
          new Cycling(
            this.#mapE.latlng,
            distance,
            duration,
            elevationGain,
            type
          )
        );
      }

      this._renderWorkoutMarker(this.#workouts[this.#workouts.length - 1]);
      this._renderWorkout(this.#workouts[this.#workouts.length - 1]);

      inputElevation.value =
        inputCadence.value =
        inputDistance.value =
        inputDuration.value =
          "";
    }
  }
  
  _renderWorkoutMarkerOnStart(workout) {
    const { lat, lng } = workout.coords;
    let date = new Date(workout.date)
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type === "running" ? "🏃🏽" : "🚴🏽‍♀️"
        } ${workout.type[0].toUpperCase() + workout.type.substring(1)} on ${months[date.getMonth()]} ${date.getDate()}`
      )
  }

  _renderWorkoutMarker(workout) {
    const { lat, lng } = workout.coords;
    let date = new Date(workout.date)
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type === "running" ? "🏃🏽" : "🚴🏽‍♀️"
        } ${workout.type[0].toUpperCase() + workout.type.substring(1)} on ${months[date.getMonth()]} ${date.getDate()}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
  
    let date = new Date(workout.date)
    
    const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${
        workout.type[0].toUpperCase() + workout.type.substring(1)
      } on ${months[date.getMonth()]} ${date.getDate()}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃🏽" : "🚴🏽‍♀️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.type === "running"
            ? workout.pace.toFixed(1)
            : workout.speed.toFixed(1)
        }</span>
        <span class="workout__unit">${
          workout.type === "running" ? "min/km" : "km/h"
        }</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🦶🏼" : "⛰️"
        }</span>
        <span class="workout__value">${
          workout.type === "running" ? workout.cadence : workout.elevationGain
        }</span>
        <span class="workout__unit">${
          workout.type === "running" ? "spm" : "m"
        }</span>
      </div>
    </li>`;

    form.insertAdjacentHTML("afterend", html);
    form.classList.add("hidden");
    this._setLocalStorage()
  }
  
  _moveToPopup(e){
    const workoutE = e.target.closest('.workout')
    console.log(workoutE)
    
    if(!workoutE) return 
    
    const workout = this.#workouts.find(work => work.id === workoutE.dataset.id)
    
    this.#map.setView(workout.coords, 17)
    
  }
  
  _setLocalStorage(){
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'))
    
    if (!data) return
    
    this.#workouts = data
    
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout)
    })
  }
}

const mapty = new App();

const run1 = new Running();
