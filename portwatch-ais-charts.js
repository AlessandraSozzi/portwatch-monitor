const shift = 365; // Changed from 52*7: 52*7days - to keep comparing mondays with mondays, tuesdays with tuesdays, etc
const ma = 7;

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

var parsePort = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      date: feature.attributes.date,
      portid: feature.attributes.portid,
      portname: feature.attributes.portname,
      country: feature.attributes.country,
      portcalls_tanker: parseInt(feature.attributes.portcalls_tanker),
      portcalls_cargo: parseInt(feature.attributes.portcalls_cargo),
      portcalls: parseInt(feature.attributes.portcalls),
      import: parseFloat(feature.attributes.import),
      export: parseFloat(feature.attributes.export),
    };
    return datapoint;
  });

  series.sort((a, b) => a.date - b.date);
  return series;
};

var parseRegion = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      date: Date.parse(feature.attributes.date),
      ISO3: feature.attributes.ISO3,
      country: feature.attributes.country,
      portcalls_container: parseInt(feature.attributes.portcalls_container),
      portcalls_container_7MA_yoy:
        parseFloat(feature.attributes.portcalls_container_7MA_yoy_doy) * 100,
      portcalls_container_15MA_yoy:
        parseFloat(feature.attributes.portcalls_container_15MA_yoy_do) * 100,
    };
    return datapoint;
  });

  series.sort((a, b) => a.date - b.date);
  return series;
};

var groupPorts = function (data) {
  const reduced = data.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = {
        date: item.date,
        portcalls_tanker: 0,
        portcalls_cargo: 0,
        portcalls: 0,
        import: 0,
        export: 0,
      };
    }
    acc[item.date]["portcalls_tanker"] += item.portcalls_tanker;
    acc[item.date]["portcalls_cargo"] += item.portcalls_cargo;
    acc[item.date]["portcalls"] += item.portcalls;
    acc[item.date]["import"] += item.import;
    acc[item.date]["export"] += item.export;
    return acc;
  }, {});

  return Object.values(reduced);
};

var generateIndicators = function (series) {
  series.sort((a, b) => a.date - b.date);

  import_MA = movingAvg(
    series.map((x) => x.import),
    ma,
    0
  );
  export_MA = movingAvg(
    series.map((x) => x.export),
    ma,
    0
  );
  portcalls_MA = movingAvg(
    series.map((x) => x.portcalls),
    ma,
    0
  );

  series = series.map(function (feature, i) {
    feature["import_MA"] = import_MA[i];
    feature["export_MA"] = export_MA[i];
    feature["portcalls_MA"] = portcalls_MA[i];
    if (i > shift) {
      feature["import_MA_shifted"] = import_MA[i - shift];
      feature["export_MA_shifted"] = export_MA[i - shift];
      feature["portcalls_MA_shifted"] = portcalls_MA[i - shift];
    }
    return feature;
  });

  //console.log(series);
  return series;
};

var parseEvents = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      eventid: feature.attributes.eventid,
      eventtype: feature.attributes.eventtype,
      eventname: feature.attributes.eventname,
      affectedports: feature.attributes.affectedports,
      fromdate: feature.attributes.fromdate,
      todate:
        feature.attributes.todate == null
          ? Date.now()
          : feature.attributes.todate,
    };
    return datapoint;
  });
  return series;
};

var labels = {
  portcalls: {
    yAxis: "Number of Ships",
    title: "Arrivals of Ships",
  },
  import: {
    yAxis: "Metric Tons",
    title: "Import Volume",
    name: "Import Volume",
  },
  export: {
    yAxis: "Metric Tons",
    title: "Export Volume",
    name: "Export Volume",
  },
};

var options = {
  chart: {
    backgroundColor: "#fff",
  },

  credits: {
    enabled: false,
  },

  legend: {
    enabled: true,
  },

  plotOptions: {
    series: {
      dataGrouping: {
        enabled: false,
      },
      showInNavigator: true,
    },
    column: {
      stacking: "normal",
    },
  },

  rangeSelector: {
    selected: 1,
  },

  xAxis: {
    plotBands: [],
  },

  exporting: {
    enabled: true,
    buttons: {
      contextButton: {
        symbol: "download",
        text: "Export Data",
      },
    },
  },

  series: [],
};

var createDisruptionAisChart = function (data, chartType = "portcalls") {
  options["yAxis"] = {
    title: {
      text: labels[chartType].yAxis,
    },
    opposite: false,
  };

  if (chartType == "portcalls") {
    options.series = [
      {
        name: "Number of Cargo Ships",
        data: data.map((x) => [x.date, x["portcalls_cargo"]]),
        type: "column",
        stack: 1,
        tooltip: {
          valueDecimals: 0,
        },
        color: "#afc5dc",
        showInLegend: true,
      },
      {
        name: "Number of Tanker Ships",
        data: data.map((x) => [x.date, x["portcalls_tanker"]]),
        type: "column",
        stack: 1,
        tooltip: {
          valueDecimals: 0,
        },
        color: "#004c97",
        showInLegend: true,
      },
    ];
  } else {
    options.series = [
      {
        name: labels[chartType].name,
        data: data.map((x) => [x.date, x[chartType]]),
        type: "column",
        tooltip: {
          valueDecimals: 0,
        },
        color: "#004c97",
        showInLegend: true,
      },
    ];
  }

  options.series = options.series.concat([
    {
      name: "7-day Moving Average",
      data: data.map((x) => [x.date, x[chartType + "_MA"]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      color: "#f3ab0a",
      tooltip: {
        valueDecimals: 0,
      },
      showInLegend: true,
    },
    {
      name: "Prior Year: 7-day Moving Average",
      data: data
        .slice(shift + 1)
        .map((x) => [x.date, x[chartType + "_MA_shifted"]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      dashStyle: "Dash",
      color: "#474747",
      tooltip: {
        valueDecimals: 0,
      },
      showInLegend: true,
    },
  ]);

  options["title"] = {
    text: "Aggregated " + labels[chartType].title,
  };

  var chart = new Highcharts.stockChart("container", options);
};

var createAisChart = function (data, chartType = "portcalls") {
  options["title"] = {
    text: data[0].portname + ": " + labels[chartType].title,
  };

  options["yAxis"] = {
    title: {
      text: labels[chartType].yAxis,
    },
    opposite: false,
  };

  if (chartType == "portcalls") {
    options.series = [
      {
        name: "Number of Cargo Ships",
        data: data.map((x) => [x.date, x["portcalls_cargo"]]),
        type: "column",
        stack: 1,
        tooltip: {
          valueDecimals: 0,
        },
        color: "#afc5dc",
        showInLegend: true,
      },
      {
        name: "Number of Tanker Ships",
        data: data.map((x) => [x.date, x["portcalls_tanker"]]),
        type: "column",
        stack: 1,
        tooltip: {
          valueDecimals: 0,
        },
        color: "#004c97",
        showInLegend: true,
      },
    ];
  } else {
    options.series = [
      {
        name: labels[chartType].name,
        data: data.map((x) => [x.date, x[chartType]]),
        type: "column",
        tooltip: {
          valueDecimals: 0,
        },
        color: "#004c97",
        showInLegend: true,
      },
    ];
  }

  options.series = options.series.concat([
    {
      name: "7-day Moving Average",
      data: data.map((x) => [x.date, x[chartType + "_MA"]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      color: "#f3ab0a",
      tooltip: {
        valueDecimals: 0,
      },
      showInLegend: true,
    },
    {
      name: "Prior Year: 7-day Moving Average",
      data: data
        .slice(shift + 1)
        .map((x) => [x.date, x[chartType + "_MA_shifted"]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      dashStyle: "Dash",
      color: "#474747",
      tooltip: {
        valueDecimals: 0,
      },
      showInLegend: true,
    },
  ]);

  var chart = new Highcharts.stockChart("container", options);
};

var createAisYoYChart = function (data, chartType = "portcalls") {
  Jan1 = new Date("2025-01-01").getTime();
  Apr2 = new Date("2025-04-02").getTime();
  console.log("Jan1", Jan1);
  console.log("Apr2", Apr2);

  options["title"] = {
    text: data[0].country + ": " + "Port Calls by Container Ships",
  };
  options["subtitle"] = {
    text: "(Number of vessels, year on year % change)",
    align: "left",
    style: {
      color: "#333333",
    },
    x: 25,
  };
  options["xAxis"] = {
    gridLineColor: "#333333",
    lineColor: "#333333",
    labels: {
      style: {
        color: "#333333",
      },
    },
    tickColor: "#333333",
    type: "datetime",
    crossing: 0,
    plotLines: [
      {
        color: "#333333", // Black
        value: Apr2,
        label: {
          inside: false,
          text: "April 2",
          rotation: 0,
          y: 15,
          style: {
            color: "#333333",
            fontWeight: "bold",
          },
        },
      },
    ],
  };
  options["yAxis"] = {
    title: {
      text: "",
    },
    opposite: false,
  };
  options["rangeSelector"] = {
    selected: 3,
  };

  options.series = options.series.concat([
    {
      name: "7-day Moving Average",
      data: data
        .filter((x) => x.date >= new Date("2020-01-01").getTime())
        .map((x) => [x.date, x[chartType + "_container_7MA_yoy"]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 2,
      },
      color: "#2F6EBA",
      tooltip: {
        valueDecimals: 1,
      },
      showInLegend: true,
    },
    {
      name: "15-day Moving Average",
      data: data
        .filter((x) => x.date >= new Date("2020-01-01").getTime())
        .map((x) => [x.date, x[chartType + "_container_15MA_yoy"]]),
      type: "line",
      marker: {
        enabled: false, // auto
        lineWidth: 2,
      },
      color: "#EA3324",
      tooltip: {
        valueDecimals: 1,
      },
      showInLegend: true,
    },
  ]);

  var chart = new Highcharts.stockChart("container", options);
};

/// TESTS

//console.log(labels);

test_array = movingAvg(
  [
    1116,
    1240,
    1273,
    1243,
    1337,
    1294,
    1210,
    1331,
    1245,
    1388,
    1294,
    1338,
    1293,
    1213, // 2024
    990,
    1179,
    1235,
    1226,
    1188,
    1258,
    1264,
    1296,
    1289,
    1294,
    1268,
    1248,
    1311,
    1267,
  ],
  7 * 2
);
//console.log(test_array);
//console.log(growthRate(test_array, 7));
