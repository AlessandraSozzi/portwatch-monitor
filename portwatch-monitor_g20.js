const ma = 3; // Months in the moving average of the growth rate
const gr = 12; // Months for the year-over-year growth rate

// Series approved for publication by economy.
// 1 = approved, null = not approved.
const APPROVED = {
  ARG: { export_value: 1, import_value: 1, export_volume: 1, import_volume: 1 },
  AUS: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  BRA: { export_value: 1, import_value: 1, export_volume: 1, import_volume: 1 },
  CAN: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  CHN: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  EU: { export_value: 1, import_value: 1, export_volume: 1, import_volume: 1 },
  IDN: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  IND: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  JPN: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  KOR: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  SAU: { export_value: 1, import_value: null, export_volume: null, import_volume: null },
  TUR: { export_value: 1, import_value: 1, export_volume: null, import_volume: null },
  USA: { export_value: 1, import_value: 1, export_volume: 1, import_volume: 1 },
  ZAF: { export_value: 1, import_value: 1, export_volume: 1, import_volume: 1 },
};

const ISO_MAP = {
  EU: "998",
};

const ECONOMIES = [
  { iso3: "ARG", name: "Argentina" },
  { iso3: "AUS", name: "Australia" },
  { iso3: "BRA", name: "Brazil" },
  { iso3: "CAN", name: "Canada" },
  { iso3: "CHN", name: "China" },
  { iso3: "IND", name: "India" },
  { iso3: "IDN", name: "Indonesia" },
  { iso3: "JPN", name: "Japan" },
  { iso3: "KOR", name: "Korea" },
  { iso3: "SAU", name: "Saudi Arabia" },
  { iso3: "ZAF", name: "South Africa" },
  { iso3: "TUR", name: "Turkiye" },
  { iso3: "USA", name: "United States" },
];

const DEFAULT_ECONOMY = "ARG";

const MEASURES = ["value", "volume"];

const MEASURE_STYLES = {
  value: { name: "Value", color: "#f3a90a", dashStyle: "Solid" },
  volume: { name: "Volume", color: "#4fc3f7", dashStyle: "ShortDash" },
};

var getApprovedMeasures = function (code, flow) {
  /**
   * Return the measures approved for an economy and flow.
   * @param {String} code - Key of APPROVED (e.g. USA, EU); null approves all
   * @param {String} flow - Type of chart (trade, import, export)
   * @returns {Array} e.g. ["value", "volume"], ["value"] or []
   */
  if (code === null) return MEASURES.slice();
  if (!(code in APPROVED)) return [];

  return MEASURES.filter((m) => APPROVED[code][flow + "_" + m] === 1);
};

var downloadSymbol = function (x, y, w, h) {
  const path = [
    // Arrow stem
    "M",
    x + w * 0.5,
    y,
    "L",
    x + w * 0.5,
    y + h * 0.7,
    // Arrow head
    "M",
    x + w * 0.3,
    y + h * 0.5,
    "L",
    x + w * 0.5,
    y + h * 0.7,
    "L",
    x + w * 0.7,
    y + h * 0.5,
    // Box
    "M",
    x,
    y + h * 0.9,
    "L",
    x,
    y + h,
    "L",
    x + w,
    y + h,
    "L",
    x + w,
    y + h * 0.9,
  ];
  return path;
};

var movingAvg = function (array, countBefore, countAfter) {
  if (countAfter == undefined) countAfter = 0;
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (i < countBefore - 1) {
      result.push(null);
      continue;
    }
    const subArr = array.slice(
      Math.max(i - countBefore + 1, 0),
      Math.min(i + countAfter + 1, array.length)
    );
    const avg =
      subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
    result.push(avg);
  }
  return result;
};

var strCapitalize = function (str, separator = " ") {
  var splitStr = str.toLowerCase().split(separator);
  for (var i = 0; i < splitStr.length; i++) {
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(" ");
};

var growthRate = function (array, countBefore) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (i < countBefore) {
      result.push(null);
      continue;
    }
    const growth = (array[i] / array[i - countBefore] - 1) * 100;
    result.push(growth);
  }
  return result;
};

var seriesMin = function (array) {
  var cleanedArray = array.filter((x) => x !== null && !isNaN(x));
  return Math.min(...cleanedArray);
};

var seriesMax = function (array) {
  var cleanedArray = array.filter((x) => x !== null && !isNaN(x));
  return Math.max(...cleanedArray);
};

var generateData = function (features) {
  /**
   * Parse features and add year-over-year growth rates (_GR) and their
   * 3-month moving average (_GR_MA) for trade, import and export.
   * @param {Array} features - Features returned by the feature layer query
   */
  var series = features.map((feature) => ({
    region: feature.attributes.region,
    ISO3: feature.attributes.ISO3,
    date: Date.parse(feature.attributes.date),
    import_volume: parseFloat(feature.attributes.volume_import_total),
    export_volume: parseFloat(feature.attributes.volume_export_total),
    import_value: parseFloat(feature.attributes.value_import_total),
    export_value: parseFloat(feature.attributes.value_export_total),
    trade_value: parseFloat(feature.attributes.trade_value),
    trade_volume: parseFloat(feature.attributes.trade_volume),
  }));

  series.sort((a, b) => a.date - b.date);

  ["trade", "import", "export"].forEach((flow) => {
    MEASURES.forEach((measure) => {
      var key = flow + "_" + measure;
      var values = series.map((x) => x[key]);
      var growth = growthRate(values, gr).slice(gr, series.length);
      var growthMA = movingAvg(growth, ma, 0);

      series.forEach(function (feature, i) {
        if (i >= gr) {
          feature[key + "_GR"] = growth[i - gr];
          feature[key + "_GR_MA"] = growthMA[i - gr];
        }
      });
    });
  });

  return series;
};

var chartsExtent = function (series, flowMeasures, suffix = "_GR_MA") {
  /**
   * Y axis min/max across all the series plotted in a tab
   * @param {Array} series - Array of objects with the data
   * @param {Object} flowMeasures - e.g. {import: ["value"], export: ["value", "volume"]}
   * @param {String} suffix - Suffix to append to the column names (e.g. _GR_MA)
   */
  var columns = [];
  Object.keys(flowMeasures).forEach((flow) => {
    flowMeasures[flow].forEach((m) => columns.push(flow + "_" + m + suffix));
  });
  if (columns.length === 0) return null;

  var allMin = columns.map((col) => seriesMin(series.map((s) => s[col])));
  var allMax = columns.map((col) => seriesMax(series.map((s) => s[col])));

  return [Math.min(...allMin), Math.max(...allMax)];
};

var flowLabel = function (flow) {
  return { trade: "Total Trade", import: "Imports", export: "Exports" }[flow];
};

var dynamicTitle = function (name, flow) {
  /**
   * Chart title, e.g. "Argentina: Imports"
   * @param {String} name - Name of the economy or region
   * @param {String} flow - Type of chart (trade, import, export)
   */
  return name + ": " + flowLabel(flow);
};

var dynamicYLabel = function (measures) {
  var units = measures.includes("volume")
    ? "Value in US dollars; volume in constant prices."
    : "Value in US dollars.";
  return "3-month moving average, year on year change (%). " + units;
};

var dynamicText = function (series, name, flow, measures, isWorld) {
  /**
   * Summary sentence for the latest 3-month period
   * @param {Array} series - Array of objects with the data
   * @param {String} name - Name of the economy or region
   * @param {String} flow - Type of chart (trade, import, export)
   * @param {Array} measures - Measures plotted (value, volume)
   * @param {Boolean} isWorld - Whether the sentence describes the world
   */
  var lastObs = series[series.length - 1];
  var lastPeriodEnd = new Date(lastObs["date"]);
  var lastPeriodStart = new Date(
    Date.UTC(lastPeriodEnd.getUTCFullYear(), lastPeriodEnd.getUTCMonth() - 2, 1)
  );
  var fmt = { year: "numeric", month: "long", timeZone: "UTC" };

  var subject = isWorld
    ? "Global maritime <b class='text-highlight'>" +
      flowLabel(flow).toLowerCase() +
      "</b>"
    : "Maritime <b class='text-highlight'>" +
      flowLabel(flow).toLowerCase() +
      "</b> of " +
      (/^(United|European)/.test(name) ? "the " : "") +
      name;

  var changes = measures.map(function (m) {
    var lastValue = Math.round(lastObs[flow + "_" + m + "_GR_MA"] * 10) / 10;
    var trend = lastValue > 0 ? "increased" : "decreased";
    return (
      "<b class='text-highlight'>" +
      trend +
      " by " +
      Math.abs(lastValue) +
      " percent</b> in " +
      m
    );
  });

  return (
    subject +
    " over <b class='text-highlight'>" +
    lastPeriodStart.toLocaleDateString("en-us", fmt) +
    "-" +
    lastPeriodEnd.toLocaleDateString("en-us", fmt) +
    "</b> " +
    (flow === "trade" ? "is" : "are") +
    " estimated to have " +
    changes.join(" and ") +
    " compared to a year ago."
  );
};

var charts = {}; // Highcharts instances by container ID

var destroyChart = function (containerID) {
  if (charts[containerID]) {
    charts[containerID].destroy();
    delete charts[containerID];
  }
};

var createGrowthRateChart = function (
  data,
  containerID,
  flow,
  measures,
  ylim = null
) {
  /**
   * Line chart of the 3MMA of the YoY growth rate, one line per measure
   * @param {Array} data - Array of objects with the data
   * @param {String} containerID - ID of the chart container
   * @param {String} flow - Type of chart (trade, import, export)
   * @param {Array} measures - Measures to plot (value, volume)
   * @param {Array} ylim - Y axis [min, max]
   */
  destroyChart(containerID);

  var options = {
    credits: {
      enabled: false,
    },

    legend: {
      enabled: true,
      itemHiddenStyle: {
        color: "#666",
      },
      itemHoverStyle: {
        color: "#f3a90a",
      },
      itemStyle: {
        color: "#fff",
      },
    },

    plotOptions: {
      series: {
        dataGrouping: {
          enabled: false,
        },
      },
    },

    title: "",

    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          symbol: "download",
          text: "",
          symbolFill: "#c0c0c0",
          symbolStroke: "#c0c0c0",
        },
      },
    },
    tooltip: {
      shared: true,
      valueDecimals: 1,
      valueSuffix: "%",
      style: {
        color: "#fff",
      },
    },
    series: [],
  };

  options["yAxis"] = {
    gridLineColor: "#c0c0c0",
    labels: {
      style: {
        color: "#c0c0c0",
      },
    },
    title: {
      text: "",
    },
    opposite: false,
  };

  if (ylim !== null) {
    options["yAxis"]["min"] = ylim[0];
    options["yAxis"]["max"] = ylim[1];
  }

  options["xAxis"] = {
    gridLineColor: "#c0c0c0",
    lineColor: "#c0c0c0",
    labels: {
      style: {
        color: "#c0c0c0",
      },
    },
    tickColor: "#c0c0c0",
    type: "datetime",
    crossing: 0,
  };

  options.series = measures.map((m) => ({
    name: MEASURE_STYLES[m].name,
    data: data
      .slice(gr, data.length)
      .map((x) => [x.date, x[flow + "_" + m + "_GR_MA"]]),
    type: "spline",
    marker: {
      enabled: false,
    },
    color: MEASURE_STYLES[m].color,
    dashStyle: MEASURE_STYLES[m].dashStyle,
    showInLegend: true,
  }));

  charts[containerID] = new Highcharts.Chart(containerID, options);

  return options;
};
