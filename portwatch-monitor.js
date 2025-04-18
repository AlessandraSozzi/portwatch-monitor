const shift = 12; // Changed from 52*7: 52*7days - to keep comparing mondays with mondays, tuesdays with tuesdays, etc
const ma = 3;
const gr = 12;

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

var indexed = function (series, column, base = 2019) {
  const values2019 = series
    .filter((x) => x.date.getFullYear() == base)
    .map((x) => x[column]);
  const avg2019 =
    values2019.reduce((sum, currentValue) => sum + currentValue, 0) /
    values2019.length;
  return (series.map((x) => x[column]) / avg2019) * 100;
};

var strCapitalize = function (str, separator = " ") {
  var splitStr = str.toLowerCase().split(separator);
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
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

var roundToNearestTenth = function(number) {
  return Math.round(number * 10) / 10;
};

var seriesMin = function (array) {
  var cleanedArray = array.filter((x) => !isNaN(x));
  var min = Math.min(...cleanedArray);
  return min;
};

var seriesMax = function (array) {
  var cleanedArray = array.filter((x) => !isNaN(x));
  var max = Math.max(...cleanedArray);
  return max;
};

var generateData = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      region: feature.attributes.region,
      ISO3: feature.attributes.ISO3,
      date: Date.parse(feature.attributes.date),
      portcalls_tanker: parseInt(feature.attributes.ais_portcalls_tanker),
      portcalls_general_cargo: parseInt(
        feature.attributes.ais_portcalls_general_cargo
      ),
      portcalls_dry_bulk: parseInt(feature.attributes.ais_portcalls_dry_bulk),
      portcalls_roro: parseInt(feature.attributes.ais_portcalls_roro),
      portcalls_container: parseInt(feature.attributes.ais_portcalls_container),
      import_volume: parseFloat(feature.attributes.volume_import_total),
      export_volume: parseFloat(feature.attributes.volume_export_total),
      import_value: parseFloat(feature.attributes.value_import_total),
      export_value: parseFloat(feature.attributes.value_export_total),
      trade_value: parseFloat(feature.attributes.trade_value),
      trade_volume: parseFloat(feature.attributes.trade_volume),
    };

    datapoint["portcalls"] =
      datapoint["portcalls_tanker"] +
      datapoint["portcalls_general_cargo"] +
      datapoint["portcalls_dry_bulk"] +
      datapoint["portcalls_roro"] +
      datapoint["portcalls_container"];

    return datapoint;
  });

  series.sort((a, b) => a.date - b.date);

  trade_value_MA = movingAvg(
    series.map((x) => x.trade_value),
    ma,
    0
  );
  trade_volume_MA = movingAvg(
    series.map((x) => x.trade_volume),
    ma,
    0
  );
  import_value_MA = movingAvg(
    series.map((x) => x.import_value),
    ma,
    0
  );
  export_value_MA = movingAvg(
    series.map((x) => x.export_value),
    ma,
    0
  );
  import_volume_MA = movingAvg(
    series.map((x) => x.import_volume),
    ma,
    0
  );
  export_volume_MA = movingAvg(
    series.map((x) => x.export_volume),
    ma,
    0
  );
  portcalls_MA = movingAvg(
    series.map((x) => x.portcalls),
    ma,
    0
  );

  portcalls_GR = growthRate(
    series.map((x) => x.portcalls),
    gr
  ).slice(gr, series.length);
  import_value_GR = growthRate(
    series.map((x) => x.import_value),
    gr
  ).slice(gr, series.length);
  export_value_GR = growthRate(
    series.map((x) => x.export_value),
    gr
  ).slice(gr, series.length);
  import_volume_GR = growthRate(
    series.map((x) => x.import_volume),
    gr
  ).slice(gr, series.length);
  export_volume_GR = growthRate(
    series.map((x) => x.export_volume),
    gr
  ).slice(gr, series.length);
  trade_value_GR = growthRate(
    series.map((x) => x.trade_value),
    gr
  ).slice(gr, series.length);
  trade_volume_GR = growthRate(
    series.map((x) => x.trade_volume),
    gr
  ).slice(gr, series.length);

  portcalls_GR_MA = movingAvg(portcalls_GR, ma, 0);
  import_value_GR_MA = movingAvg(import_value_GR, ma, 0);
  export_value_GR_MA = movingAvg(export_value_GR, ma, 0);
  import_volume_GR_MA = movingAvg(import_volume_GR, ma, 0);
  export_volume_GR_MA = movingAvg(export_volume_GR, ma, 0);
  trade_value_GR_MA = movingAvg(trade_value_GR, ma, 0);
  trade_volume_GR_MA = movingAvg(trade_volume_GR, ma, 0);

  series = series.map(function (feature, i) {
    feature["portcalls_MA"] = portcalls_MA[i];
    feature["import_value_MA"] = import_value_MA[i];
    feature["export_value_MA"] = export_value_MA[i];
    feature["import_volume_MA"] = import_volume_MA[i];
    feature["export_volume_MA"] = export_volume_MA[i];
    feature["trade_value_MA"] = trade_value_MA[i];
    feature["trade_volume_MA"] = trade_volume_MA[i];
    if (i >= gr) {
      feature["portcalls_GR"] = portcalls_GR[i - gr];
      feature["import_value_GR"] = import_value_GR[i - gr];
      feature["export_value_GR"] = export_value_GR[i - gr];
      feature["import_volume_GR"] = import_volume_GR[i - gr];
      feature["export_volume_GR"] = export_volume_GR[i - gr];
      feature["trade_value_GR"] = trade_value_GR[i - gr];
      feature["trade_volume_GR"] = trade_volume_GR[i - gr];
      // Moving Average of growth rates
      feature["portcalls_GR_MA"] = portcalls_GR_MA[i - gr];
      feature["import_value_GR_MA"] = import_value_GR_MA[i - gr];
      feature["export_value_GR_MA"] = export_value_GR_MA[i - gr];
      feature["import_volume_GR_MA"] = import_volume_GR_MA[i - gr];
      feature["export_volume_GR_MA"] = export_volume_GR_MA[i - gr];
      feature["trade_value_GR_MA"] = trade_value_GR_MA[i - gr];
      feature["trade_volume_GR_MA"] = trade_volume_GR_MA[i - gr];
    }
    return feature;
  });

  //console.log(series);
  return series;
};

var labels = {
  portcalls: {
    yAxis: "Number of Ships",
    title: "Monthly Arrivals of Ships",
    name: "Number of Ships",
  },
  import_volume: {
    yAxis: "Index [2019 avg. = 100]; not seasonally adjusted.",
    title: "Monthly Import Volume",
    name: "Import Volume",
  },
  export_volume: {
    yAxis: "Index [2019 avg. = 100]; not seasonally adjusted.",
    title: "Monthly Export Volume",
    name: "Export Volume",
  },
  import_value: {
    yAxis: "Index [2019 avg. = 100]; not seasonally adjusted.",
    title: "Monthly Import Value",
    name: "Import Volume",
  },
  trade_value: {
    yAxis: "Index [2019 avg. = 100]; not seasonally adjusted.",
    title: "Monthly Trade Value",
    name: "Trade Value",
  },
  trade_volume: {
    yAxis: "Index [2019 avg. = 100]; not seasonally adjusted.",
    title: "Monthly Trade Volume",
    name: "Trade Volume",
  },
  export_value: {
    yAxis: "Index [2019 avg. = 100]; not seasonally adjusted.",
    title: "Monthly Export Value",
    name: "Export Volume",
  },
  growth_rate: {
    yAxis: "Percentage Change",
  },
};

var createChart = function (
  data,
  regionid,
  containerID,
  chartType = "portcalls",
  ylim = null
) {

  
  var options = {
    credits: {
      enabled: false,
    },

    legend: {
      enabled: true,
      itemHiddenStyle: {
        color: "#fff",
      },
      itemHoverStyle: {
        color: "#fff",
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
      column: {
        stacking: "normal",
      },
    },

    xAxis: {
      plotBands: [],
    },

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
      style: {
        color: "#fff",
      },
    },

    series: [],
  };

  var region = data[0].region;
  console.log(region + " " + strCapitalize(chartType, (separator = "_")));

  options["title"] = {
    text: region + " " + strCapitalize(chartType, (separator = "_")),
    style: {
      color: "#c0c0c0",
    },
  };

  options["subtitle"] = {
    text: labels[chartType].yAxis,
    align: "left",
    style: {
      color: "#c0c0c0",
    },
    x: 25,
  };

  options["yAxis"] = {
    gridLineColor: "#c0c0c0",
    labels: {
      style: {
        color: "#c0c0c0",
      },
    },
    opposite: false,
    title: {
      text: "",
    },
  };

  if (ylim !== null) {
    console.log(ylim);
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
  };

  options.series = [
    {
      name: chartType.replace("_", " ") + " index",
      data: data.map((x) => [x.date, x[chartType]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      color: "#f3a90a",
      tooltip: {
        valueDecimals: 1,
      },
      showInLegend: false,
    },
  ];

  var chart = new Highcharts.Chart(containerID, options);

  return options;
};

var createGrowthRateChart = function (
  data,
  regionid,
  containerID,
  chartType = "portcalls",
  ylim = null
) {

  var options = {
    credits: {
      enabled: false,
    },

    legend: {
      enabled: false,
      itemHiddenStyle: {
        color: "#fff",
      },
      itemHoverStyle: {
        color: "#fff",
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
      column: {
        stacking: "normal",
        negativeColor: "#FFFFED",
        threshold: 0,
      },
    },

    xAxis: {
      plotBands: [],
    },

    title: '',

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
      style: {
        color: "#fff",
      },
    },
    series: [],
  };

  var region = data[0].region;
  console.log(region + " " + strCapitalize(chartType, (separator = "_")));

  options["yAxis"] = {
    gridLineColor: "#c0c0c0",
    labels: {
      style: {
        color: "#c0c0c0",
      }
    },
    title: {
      text: '',
    },
    opposite: false,
  };

  if (ylim !== null) {
    console.log(ylim);
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
    crossing: 0
  };

  options.series = [
// Remove bars
/*     {
      name: "Y-o-Y",
      data: data
        .slice(gr, data.length)
        .map((x) => [x.date, x[chartType + "_GR"]]),
      type: "column",
      stack: 1,
      tooltip: {
        valueDecimals: 1,
      },
      color: "#f3a90a",
      showInLegend: true,
    }, */
    {
      name: "3-month MA",
      data: data
        .slice(gr, data.length)
        .map((x) => [x.date, x[chartType + "_GR_MA"]]),
      type: "spline",
      tooltip: {
        valueDecimals: 1,
      },
      marker: {
        enabled: false,
      },
      color: "#f3a90a", //"#FFFFED",
      dashStyle: "LongDash",
      showInLegend: true,
    },
  ];

  //console.log(options);

  var chart = new Highcharts.Chart(containerID, options);

  return options;
};

/// TESTS

console.log(labels);

console.log(movingAvg([1, 2, 3, 1, 1, 1], 2));

console.log(growthRate([1, 2, 3, 1, 1, 1], 3));
