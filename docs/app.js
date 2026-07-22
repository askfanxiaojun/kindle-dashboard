(function () {
  "use strict";

  var DEFAULTS = {
    city: "新加坡",
    latitude: "1.3521",
    longitude: "103.8198"
  };
  var CACHE_KEY = "kindle-dashboard-weather-v1";
  var WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  var SHORT_WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  var MONTHS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

  function byId(id) {
    return document.getElementById(id);
  }

  function text(id, value) {
    var node = byId(id);
    if (node) {
      if (typeof node.textContent !== "undefined") {
        node.textContent = value;
      } else {
        node.innerText = value;
      }
    }
  }

  function getQuery(name) {
    var query = window.location.search.substring(1).split("&");
    var i;
    var pair;
    for (i = 0; i < query.length; i += 1) {
      pair = query[i].split("=");
      if (decodeURIComponent(pair[0] || "") === name) {
        return decodeURIComponent((pair[1] || "").replace(/\+/g, " "));
      }
    }
    return "";
  }

  function getConfig() {
    var latitude = getQuery("lat") || DEFAULTS.latitude;
    var longitude = getQuery("lon") || DEFAULTS.longitude;
    var city = getQuery("city") || DEFAULTS.city;
    if (!isFinite(parseFloat(latitude))) {
      latitude = DEFAULTS.latitude;
    }
    if (!isFinite(parseFloat(longitude))) {
      longitude = DEFAULTS.longitude;
    }
    return {
      city: city.substring(0, 28),
      latitude: latitude,
      longitude: longitude
    };
  }

  function formatNumber(value) {
    var number = parseFloat(value);
    if (!isFinite(number)) {
      return "--";
    }
    return String(Math.round(number));
  }

  function weatherLabel(code) {
    code = parseInt(code, 10);
    if (code === 0) { return "晴朗"; }
    if (code === 1) { return "大致晴朗"; }
    if (code === 2) { return "局部多云"; }
    if (code === 3) { return "阴天"; }
    if (code === 45 || code === 48) { return "有雾"; }
    if (code === 51 || code === 53 || code === 55) { return "毛毛雨"; }
    if (code === 56 || code === 57) { return "冻毛毛雨"; }
    if (code === 61 || code === 63) { return "有雨"; }
    if (code === 65) { return "大雨"; }
    if (code === 66 || code === 67) { return "冻雨"; }
    if (code === 71 || code === 73 || code === 75 || code === 77) { return "有雪"; }
    if (code === 80 || code === 81) { return "阵雨"; }
    if (code === 82) { return "强阵雨"; }
    if (code === 85 || code === 86) { return "阵雪"; }
    if (code === 95) { return "雷雨"; }
    if (code === 96 || code === 99) { return "雷暴伴冰雹"; }
    return "天气有变化";
  }

  function renderDate(now) {
    text("weekday", WEEKDAYS[now.getDay()]);
    text("day-number", now.getDate());
    byId("month-year").innerHTML = MONTHS[now.getMonth()] + "<br>" + now.getFullYear();
    text("calendar-title", now.getFullYear() + "年" + (now.getMonth() + 1) + "月");
    renderCalendar(now);
  }

  function renderCalendar(now) {
    var year = now.getFullYear();
    var month = now.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var mondayOffset = (firstDay + 6) % 7;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrevious = new Date(year, month, 0).getDate();
    var body = byId("calendar-body");
    var html = "";
    var cell = 0;
    var value;
    var className;
    var span;

    for (cell = 0; cell < 42; cell += 1) {
      if (cell % 7 === 0) {
        html += "<tr>";
      }
      className = "";
      span = "";
      if (cell < mondayOffset) {
        value = daysInPrevious - mondayOffset + cell + 1;
        className = "muted";
      } else if (cell >= mondayOffset + daysInMonth) {
        value = cell - mondayOffset - daysInMonth + 1;
        className = "muted";
      } else {
        value = cell - mondayOffset + 1;
        if (value === now.getDate()) {
          className = "today-cell";
          span = "<span>" + value + "</span>";
        }
      }
      html += "<td" + (className ? " class=\"" + className + "\"" : "") + ">" + (span || value) + "</td>";
      if (cell % 7 === 6) {
        html += "</tr>";
      }
    }
    body.innerHTML = html;
  }

  function renderWeather(data, cached) {
    var current = data.current || {};
    var daily = data.daily || {};
    var rows = "";
    var count = daily.time ? Math.min(daily.time.length, 4) : 0;
    var i;
    var date;
    var dayLabel;

    text("weather-state", weatherLabel(current.weather_code));
    text("temperature", formatNumber(current.temperature_2m));
    text("feels-like", formatNumber(current.apparent_temperature) + "°");
    text("humidity", formatNumber(current.relative_humidity_2m) + "%");
    text("wind", formatNumber(current.wind_speed_10m) + " km/h");

    for (i = 0; i < count; i += 1) {
      date = new Date(daily.time[i] + "T12:00:00");
      dayLabel = i === 0 ? "今天" : (i === 1 ? "明天" : SHORT_WEEKDAYS[date.getDay()]);
      rows += "<tr>" +
        "<td>" + dayLabel + "</td>" +
        "<td>" + weatherLabel(daily.weather_code[i]) + "</td>" +
        "<td>" + formatNumber(daily.temperature_2m_max[i]) + " / " + formatNumber(daily.temperature_2m_min[i]) + "°</td>" +
        "<td>降雨 " + formatNumber(daily.precipitation_probability_max[i]) + "%</td>" +
        "</tr>";
    }
    if (rows) {
      byId("forecast-table").getElementsByTagName("tbody")[0].innerHTML = rows;
    }

    text("data-status", cached ? "天气服务暂不可用 · 显示上次缓存" : "天气更新于 " + formatUpdateTime(current.time));
  }

  function formatUpdateTime(value) {
    if (!value || value.length < 16) {
      return "刚刚";
    }
    return value.substring(11, 16);
  }

  function saveCache(data) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (ignore) {}
  }

  function loadCache() {
    try {
      var raw = window.localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (ignore) {
      return null;
    }
  }

  function loadWeather(config) {
    var endpoint = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + encodeURIComponent(config.latitude) +
      "&longitude=" + encodeURIComponent(config.longitude) +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto&forecast_days=4";
    var request = new XMLHttpRequest();
    var finished = false;

    request.onreadystatechange = function () {
      var data;
      if (request.readyState !== 4 || finished) {
        return;
      }
      finished = true;
      if (request.status >= 200 && request.status < 300) {
        try {
          data = JSON.parse(request.responseText);
          renderWeather(data, false);
          saveCache(data);
          return;
        } catch (ignore) {}
      }
      weatherFailed();
    };

    request.timeout = 15000;
    request.ontimeout = function () {
      if (!finished) {
        finished = true;
        weatherFailed();
      }
    };
    request.onerror = request.ontimeout;
    try {
      request.open("GET", endpoint, true);
      request.send(null);
    } catch (ignore) {
      weatherFailed();
    }
  }

  function weatherFailed() {
    var cached = loadCache();
    if (cached) {
      renderWeather(cached, true);
    } else {
      text("weather-state", "天气暂不可用");
      text("data-status", "无法连接天气服务 · 15分钟后重试");
    }
  }

  function init() {
    var config = getConfig();
    var now = new Date();
    text("location", config.city);
    renderDate(now);
    loadWeather(config);
  }

  if (document.readyState === "loading") {
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", init, false);
    } else {
      window.attachEvent("onload", init);
    }
  } else {
    init();
  }
}());
