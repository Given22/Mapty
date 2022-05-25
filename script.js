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

  _edit(distance, duration, third) {
    this.distance = distance;
    this.duration = duration;

    if (this.type === "running") {
      this.cadence = third;
      this.calcPace();
    } else {
      this.elevationGain = third;
      this.calcSpeed();
    }
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
    this.pace = this.pace || 0;
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
    return this.speed;
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

    containerWorkouts.addEventListener("click", this._menu.bind(this));

    this._getLocalStorage();

    this._checkToAddRemoveAll();
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

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarkerOnStart(workout);
    });
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

  _renderLastWorkout() {
    this._renderWorkoutMarker(this.#workouts[this.#workouts.length - 1]);
    this._renderWorkout(this.#workouts[this.#workouts.length - 1]);
    this._checkToAddRemoveAll();
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
      if (type === "running" ) {
        const cadence = +inputCadence.value;
        this.#workouts.push(
          new Running(this.#mapE.latlng, distance, duration, cadence, type)
        );
        this._renderLastWorkout();
      } else if (type === "cycling" ) {
        const elevationGain = +inputElevation.value;
        this.#workouts.push(
          new Cycling(
            this.#mapE.latlng,
            distance,
            duration,
            elevationGain,
            type
          )
        );
        this._renderLastWorkout();
      } else {
        alert("Wrong input");
      }
    }
    inputElevation.value =
      inputCadence.value =
      inputDistance.value =
      inputDuration.value =
        "";
  }

  _renderWorkoutMarkerOnStart(workout) {
    const { lat, lng } = workout.coords;
    let date = new Date(workout.date);
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
        `${workout.type === "running" ? "🏃🏽" : "🚴🏽‍♀️"} ${
          workout.type[0].toUpperCase() + workout.type.substring(1)
        } on ${months[date.getMonth()]} ${date.getDate()}`
      );
  }

  _renderWorkoutMarker(workout) {
    const { lat, lng } = workout.coords;
    let date = new Date(workout.date);
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
        `${workout.type === "running" ? "🏃🏽" : "🚴🏽‍♀️"} ${
          workout.type[0].toUpperCase() + workout.type.substring(1)
        } on ${months[date.getMonth()]} ${date.getDate()}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let date = new Date(workout.date);

    const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <div class="workout__header">
        <h2 class="workout__title">${
          workout.type[0].toUpperCase() + workout.type.substring(1)
        } on ${months[date.getMonth()]} ${date.getDate()}</h2>
        <div class="workout__buttons">
          <p class="workout__button" id="zoom">🔎</p>
          <p class="workout__button" id="edit">✏️</p>
          <p class="workout__button" id="remove">❌</p>
        </div>
      </div>
      <div class="workout__content">
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
      </div>
      
      
    </li>`;

    form.insertAdjacentHTML("afterend", html);
    form.classList.add("hidden");
    this._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _renderWorkouts() {
    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  _removeWorkouts() {
    this.#workouts = [];
    this._reloadWorkouts();
    this._setLocalStorage();
  }

  _reloadWorkouts() {
    const works = document.querySelectorAll(".workout");

    works.forEach((w) => {
      w.remove();
    });

    this._renderWorkouts();
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;

    this._renderWorkouts();
  }

  // reset() {
  //   localStorage.removeItem("workouts");
  //   location.reload();
  // }

  _removeWorkout(id) {
    const index = this.#workouts.findIndex((work) => work.id === id);
    this.#workouts.splice(index, 1);
    localStorage.removeItem(`workouts[${index}]`);
  }


  _menu(e) {
    if (!e.target.closest(".workouts")) return;

    if (e.target.closest("#remove")) {
      const workoutE = this._getCard(e);
      this._removeWorkout(workoutE.dataset.id);
      this._reloadWorkouts();
      this._setLocalStorage();
    }
    if (e.target.closest("#zoom")) {
      const workoutE = this._getCard(e);
      this._moveToPopup(workoutE);
    }
    if (e.target.closest("#edit")) {
      const workoutE = this._getCard(e);
      this._showEditForm(workoutE);
    }
    if (e.target.closest("#close")) {
      this._closeCard(e.target.closest("#close").parentElement);
    }
    if (e.target.closest(".removeAll__button")) {
      this._removeWorkouts();
    }

    this._checkToAddRemoveAll();
  }

  _findWorkout(e) {
    return this.#workouts.find((work) => work.id === e.dataset.id);
  }

  _getCard(e) {
    return e.target.closest(".workout__button").parentElement.parentElement
      .parentElement;
  }

  _moveToPopup(e) {
    const workout = this._findWorkout(e);

    this.#map.setView(workout.coords, 16);
  }

  _removeEditForms() {
    const forms = document.querySelectorAll(".edit__form");

    forms.forEach((f) => {
      f.remove();
    });
  }

  _editWorkout(index, duration, distance, third) {
    this.#workouts[index].duration = duration;
    this.#workouts[index].distance = distance;
    if (this.#workouts[index].type === "running") {
      this.#workouts[index].cadence = third;
      this.#workouts[index].pace =
        this.#workouts[index].duration / this.#workouts[index].distance;
      this.#workouts[index].pace = this.#workouts[index].pace || 0;
    } else {
      this.#workouts[index].elevationGain = third;
      this.#workouts[index].speed =
      this.#workouts[index].distance / (this.#workouts[index].duration / 60);
      this.#workouts[index].speed = this.#workouts[index].speed || 0;
    }
  }

  _showEditForm(e) {
    this._removeEditForms();

    const workout = this._findWorkout(e);

    const html = `
    <div class="edit__form">
      <p class="edit__button" id="close">❌</p>
      <form class="edit__form__form">
            <div class="form__row">
              <label class="form__label">Distance</label>
              <input class="form__input edit__form__input--distance" value="${
                workout.distance
              }" />
            </div>
            <div class="form__row">
              <label class="form__label">Duration</label>
              <input
                class="form__input edit__form__input--duration"
                value="${workout.duration}"
              />
            </div>
            <div class="form__row">
              <label class="form__label">${
                workout.type === "running" ? "Cadence" : "Elev Gain"
              }</label>
              <input
                class="form__input edit__form__input--third"
                value="${
                  workout.type === "running"
                    ? workout.cadence
                    : workout.elevationGain
                }" 
              />
            </div>
            <button class="form__btn">OK</button>
          </form>
      </div>
    `;

    const card = document.querySelector(`[data-id="${e.dataset.id}"]`);

    card.insertAdjacentHTML("afterend", html);

    const editform = document.querySelector(".edit__form__form");

    editform.addEventListener("submit", (e) => {
      const inputEditDistance = document.querySelector(
        ".edit__form__input--distance"
      );
      const inputEditDuration = document.querySelector(
        ".edit__form__input--duration"
      );
      const inputEditThird = document.querySelector(
        ".edit__form__input--third"
      );
      const index = this.#workouts.findIndex((w) => w === workout);

      this._editWorkout(
        index,
        +inputEditDuration.value,
        +inputEditDistance.value,
        +inputEditThird.value
      );

      this._closeCard(document.querySelector(".edit__form"));

      this._reloadWorkouts();

      this._setLocalStorage();
    });
  }

  _checkToAddRemoveAll() {
    if (this.#workouts.length >= 3) {
      if (!document.contains(document.querySelector(".removeAll__button"))) {
        this._addRemoveAll();
      }
    } else {
      if (document.contains(document.querySelector(".removeAll__button"))) {
        document.querySelector(".removeAll__button").remove();
      }
    }
  }

  _addRemoveAll() {
    const html = `<p><span class='removeAll__button'>Remove All</span></p>`;
    containerWorkouts.insertAdjacentHTML("beforeend", html);
  }

  _closeCard(e) {
    e.remove();
  }
  
  printWorkouts() {
    console.log(this.#workouts)
  }
}

const mapty = new App();

// Ability to edit a workout ✅

// Ability to delete a workout ✅

// Ability to delete all workouts 

// Ability to sort workouts byacertain field (e.g. distance)

// Re-build Running and Cycling objects coming from Local Storage

// More realistic error and confirmation messages

// Ability to position the map to show all workouts[very hard]

// Ability to draw lines and shapes instead of just points[very hard]

// Geocode location from coordinates("Run in Faro,Portugal")[only after asynchronous JavaScript section]

// Display weather data for workout time and place[only after asynchronous JavaScript section]
