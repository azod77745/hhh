async function fetchWithTimeout(url) {
    const controller = new AbortController();

    const timer = setTimeout(() => {
        controller.abort();
    }, 15000);

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        return response;
    } finally {
        clearTimeout(timer);
    }
}
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temp");
const description = document.getElementById("desc");
const weatherResult = document.getElementById("weatherResult");

const weatherDescriptions = {
    0: "Ясно",
    1: "Преимущественно ясно",
    2: "Переменная облачность",
    3: "Пасмурно",
    45: "Туман",
    48: "Изморозь",
    51: "Небольшой моросящий дождь",
    53: "Моросящий дождь",
    55: "Сильный моросящий дождь",
    61: "Небольшой дождь",
    63: "Дождь",
    65: "Сильный дождь",
    71: "Небольшой снег",
    73: "Снег",
    75: "Сильный снег",
    80: "Ливень",
    81: "Сильный ливень",
    82: "Очень сильный ливень",
    85: "Снегопад",
    86: "Сильный снегопад",
    95: "Гроза",
    96: "Гроза с градом",
    99: "Сильная гроза с градом"
};

async function getWeather() {
    const city = cityInput.value.trim();

    if (city === "") {
        showError("Введите название города");
        return;
    }

    setLoading();

    try {
        // Находим координаты города
        const geocodingUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;

        const geocodingResponse = await fetch(geocodingUrl);

        if (!geocodingResponse.ok) {
            throw new Error("Не удалось найти город");
        }

        const geocodingData = await geocodingResponse.json();

        if (!geocodingData.results || geocodingData.results.length === 0) {
            showError("Город не найден. Проверьте написание");
            return;
        }

        const foundCity = geocodingData.results[0];

        // Получаем погоду по координатам
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${foundCity.latitude}` +
            `&longitude=${foundCity.longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
            `&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Не удалось получить данные о погоде");
        }

        const weatherData = await weatherResponse.json();

        showWeather(foundCity, weatherData);

    } catch (error) {
        console.error(error);
        showError("Произошла ошибка. Проверьте подключение к интернету");
    }
}

function showWeather(city, data) {
    const current = data.current;

    const country = city.country || "";
    const region = city.admin1 || "";

    let location = city.name;

    if (region) {
        location += `, ${region}`;
    }

    if (country) {
        location += `, ${country}`;
    }

    const weatherText =
        weatherDescriptions[current.weather_code] || "Погода неизвестна";

    cityName.textContent = location;

    temperature.textContent =
        `${Math.round(current.temperature_2m)}°C`;

    description.innerHTML = `
        <strong>${weatherText}</strong><br>
        Ощущается как: ${Math.round(current.apparent_temperature)}°C<br>
        Влажность: ${current.relative_humidity_2m}%<br>
        Ветер: ${Math.round(current.wind_speed_10m)} км/ч
    `;

    weatherResult.classList.remove("error", "loading");
}

function setLoading() {
    cityName.textContent = "Загрузка...";
    temperature.textContent = "--°C";
    description.textContent = "Получаем данные о погоде...";
    weatherResult.classList.add("loading");
    weatherResult.classList.remove("error");
}

function showError(message) {
    cityName.textContent = "Ошибка";
    temperature.textContent = "--°C";
    description.textContent = message;
    weatherResult.classList.add("error");
    weatherResult.classList.remove("loading");
}

// Поиск по нажатию клавиши Enter
cityInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        getWeather();
    }
});
