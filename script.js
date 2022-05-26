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

const menuBtn = document.querySelector(".menu");
const menuInputSort = document.querySelector(".menu__input--sorting");
const menuInputType = document.querySelector(".menu__input--type");

class Workout {
  date = new Date();

  constructor(coords, distance, duration, type, id) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.type = type;
    this.id = id || (Date.now() + "").slice(-10);
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
  constructor(coords, distance, duration, cadence, type, id) {
    super(coords, distance, duration, type, id);
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
  constructor(coords, distance, duration, elevationGain, type, id) {
    super(coords, distance, duration, type, id);
    this.elevationGain = elevationGain;
    this.calcSpeed(this.distance, this.duration);
  }

  calcSpeed(distance, duration) {
    this.speed = distance / (duration / 60);
    this.speed = this.speed || 0;
    return this.speed;
  }
}

class App {
  #map;
  #mapE;
  #workouts = [];
  #points = [];
  #marker = null;

  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);
    menuInputType.addEventListener("change", this._sortWorkouts.bind(this));
    menuInputSort.addEventListener("change", this._sortWorkouts.bind(this));

    containerWorkouts.addEventListener("click", this._menu.bind(this));

    menuBtn.addEventListener("click", this._toggleMenu.bind(this));
    
    document.querySelector(".menu__show__pins__btn").addEventListener("click", this._showAllPins.bind(this));

    this._getLocalStorage();

    this._checkToAddRemoveAll(this.#workouts);
  }

  _menu(e) {
    if (!e.target.closest(".workouts")) return;

    if (e.target.closest("#remove")) {
      const workoutE = this._getCard(e);
      this._removeWorkout(workoutE.dataset.id);
      this._reloadWorkouts(this.#workouts);
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

    this._checkToAddRemoveAll(this.#workouts);
  }

  _toggleMenu() {
    document.querySelector(".menu__form").classList.toggle("hidden");
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
    this.#map.on("click", this._addTemporaryMarker.bind(this));

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarkerOnStart(workout);
    });
  }

  _showForm(e) {
    this.#mapE = e;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _addTemporaryMarker(e) {
    if (this.#marker !== null) {
      this.#map.removeLayer(this.#marker);
    }
    this.#marker = L.marker(e.latlng).addTo(this.#map);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;

    let validInput = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    let positiveInput = (...inputs) => inputs.every((input) => input >= 0);

    if (!validInput(distance, duration) || !positiveInput(distance, duration)) {
      alert("Wrong input");
    } else {
      if (
        type === "running" &&
        validInput(+inputCadence.value) &&
        positiveInput(+inputCadence.value)
      ) {
        const cadence = +inputCadence.value;
        this.#workouts.push(
          new Running(this.#mapE.latlng, distance, duration, cadence, type)
        );
        this._renderLastWorkout();
      } else if (
        type === "cycling" &&
        validInput(+inputElevation.value) &&
        positiveInput(+inputElevation.value)
      ) {
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

      inputElevation.value =
        inputCadence.value =
        inputDistance.value =
        inputDuration.value =
          "";
    }
  }

  _addPoint(p) {
    this.#points.push(p);
  }

  _sortWorkouts(e) {
    const workoutTypes = menuInputType.value;
    const sortBy = menuInputSort.value;
    const dest =
      e.target.options[e.target.selectedIndex].dataset.dest === "1"
        ? "asc"
        : "desc";

    if (workoutTypes === "all") {
      this._reloadWorkouts(this._sort(this.#workouts, sortBy, dest));
    } else {
      const workouts = this.#workouts.filter(
        (workout) => workout.type === workoutTypes
      );
      this._reloadWorkouts(this._sort(workouts, sortBy, dest));
    }
  }

  _sort(workouts, sortBy, dest) {
    if (sortBy === "date") {
      if (dest === "asc") {
        return workouts.sort(
          (a, b) => new Date(a[sortBy]) - new Date(b[sortBy])
        );
      } else if (dest === "desc") {
        return workouts.sort(
          (a, b) => new Date(b[sortBy]) - new Date(a[sortBy])
        );
      }
    } else if (dest === "asc") {
      return workouts.sort((a, b) => a[sortBy] - b[sortBy]);
    } else if (dest === "desc") {
      return workouts.sort((a, b) => b[sortBy] - a[sortBy]);
    }
  }

  _renderLastWorkout() {
    this._renderWorkoutMarker(this.#workouts[this.#workouts.length - 1]);
    this._renderWorkout(this.#workouts[this.#workouts.length - 1]);
    this._checkToAddRemoveAll(this.#workouts);
  }

  _renderWorkoutMarkerOnStart(workout) {
    const { lat, lng } = workout.coords;
    let date = new Date(workout.date);
    const marker = L.marker([lat, lng])
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

    this._addPoint(marker);
  }

  _renderWorkoutMarker(workout) {
    const { lat, lng } = workout.coords;
    let date = new Date(workout.date);
    const marker = L.marker([lat, lng])
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

    this._addPoint(marker);
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
            workout.type === "running" ? workout.pace : workout.speed
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

  _renderWorkouts(workouts) {
    const works = workouts || this.#workouts;
    works.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  _removeMarker(workout) {
    const wCoords = workout.coords;
    this.#points.forEach((p) => {
      if (p._latlng.lat === wCoords.lat && p._latlng.lng === wCoords.lng) {
        this.#map.removeLayer(p);
      }
    });
  }

  _removeWorkout(id) {
    const index = this.#workouts.findIndex((work) => work.id === id);
    this._removeMarker(this.#workouts[index]);
    this.#workouts.splice(index, 1);
    localStorage.removeItem(`workouts[${index}]`);
  }

  _removeEditForms() {
    const forms = document.querySelectorAll(".edit__form");

    forms.forEach((f) => {
      f.remove();
    });
  }

  _removeWorkouts() {
    this.#workouts = [];
    this._reloadWorkouts();
    this.#points.forEach((p) => {
      this.#map.removeLayer(p);
    });
    this._setLocalStorage();
  }

  _findWorkout(e) {
    return this.#workouts.find((work) => work.id === e.dataset.id);
  }

  _reloadWorkouts(workouts) {
    const works = document.querySelectorAll(".workout");

    works.forEach((w) => {
      w.remove();
    });
    this._checkToAddRemoveAll(workouts);
    this._renderWorkouts(workouts);
  }

  _addWorkoutFromLocalStorageToApp(data) {
    if (data.type === "running") {
      this.#workouts.push(
        new Running(data.coords, data.distance, data.duration, data.cadence, data.type, data.id)
      );
    } else 
    if (data.type === "cycling") {
      this.#workouts.push(
        new Cycling(data.coords, data.distance, data.duration, data.elevationGain, data.type, data.id)
      );
    }
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    data.forEach((d) => {this._addWorkoutFromLocalStorageToApp(d)});

    this._renderWorkouts();
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }

  _getCard(e) {
    return e.target.closest(".workout__button").parentElement.parentElement
      .parentElement;
  }

  _moveToPopup(e) {
    const workout = this._findWorkout(e);

    this.#map.setView(workout.coords, 16);
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

  _checkToAddRemoveAll(workouts) {
    if (workouts?.length >= 3) {
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
    console.log(this.#workouts);
  }

  printPoints() {
    console.log(this.#points);
  }
  
  _showAllPins(){
    const group = new L.featureGroup(this.#points);
    this.#map.fitBounds(group.getBounds().pad(0.5));
  }
}

const mapty = new App();

// Ability to edit a workout ✅

// Ability to delete a workout ✅

// Ability to delete all workouts ✅

// Ability to sort workouts byacertain field (e.g. distance) ✅

// Re-build Running and Cycling objects coming from Local Storage ✅

// Ability to position the map to show all workouts[very hard] ✅

// Ability to draw lines and shapes instead of just points[very hard]

// Geocode location from coordinates("Run in Faro,Portugal")[only after asynchronous JavaScript section]

// Display weather data for workout time and place[only after asynchronous JavaScript section]
