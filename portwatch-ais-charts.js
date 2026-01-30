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

var capitalizeFirstLetter = function (val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
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


var generateNowcastSeries = function (features, ma=3, gr=12) {
  var series = features.map((feature) => {
    datapoint = {
      country: feature.attributes.region,
      ISO3: feature.attributes.ISO3,
      date: Date.parse(feature.attributes.date),
      import_volume: parseFloat(feature.attributes.volume_import_total),
      export_volume: parseFloat(feature.attributes.volume_export_total),
      import_value: parseFloat(feature.attributes.value_import_total),
      export_value: parseFloat(feature.attributes.value_export_total),
    };
    return datapoint;
  });

  series.sort((a, b) => a.date - b.date);

  
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

  import_value_GR_MA = movingAvg(import_value_GR, ma, 0);
  export_value_GR_MA = movingAvg(export_value_GR, ma, 0);
  import_volume_GR_MA = movingAvg(import_volume_GR, ma, 0);
  export_volume_GR_MA = movingAvg(export_volume_GR, ma, 0);

  series = series.map(function (feature, i) {
    feature["import_value_MA"] = import_value_MA[i];
    feature["export_value_MA"] = export_value_MA[i];
    feature["import_volume_MA"] = import_volume_MA[i];
    feature["export_volume_MA"] = export_volume_MA[i];
    if (i >= gr) {
      feature["import_value_GR"] = import_value_GR[i - gr];
      feature["export_value_GR"] = export_value_GR[i - gr];
      feature["import_volume_GR"] = import_volume_GR[i - gr];
      feature["export_volume_GR"] = export_volume_GR[i - gr];
      // Moving Average of growth rates
      feature["import_value_GR_MA"] = import_value_GR_MA[i - gr];
      feature["export_value_GR_MA"] = export_value_GR_MA[i - gr];
      feature["import_volume_GR_MA"] = import_volume_GR_MA[i - gr];
      feature["export_volume_GR_MA"] = export_volume_GR_MA[i - gr];
    }
    return feature;
  });

  //console.log(series);
  return series;
};

var parsePort = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      date: Date.parse(feature.attributes.date),
      portid: feature.attributes.portid,
      portname: feature.attributes.portname,
      country: feature.attributes.country,
      portcalls_container: parseInt(feature.attributes.portcalls_container),
      portcalls_dry_bulk: parseInt(feature.attributes.portcalls_dry_bulk),
      portcalls_general_cargo: parseInt(feature.attributes.portcalls_general_cargo),
      portcalls_roro: parseInt(feature.attributes.portcalls_roro),
      portcalls_tanker: parseInt(feature.attributes.portcalls_tanker),
      portcalls: parseInt(feature.attributes.portcalls),
      import: parseFloat(feature.attributes.import),
      export: parseFloat(feature.attributes.export),
    };
    return datapoint;
  });

  series.sort((a, b) => a.date - b.date);
  return series;
};


var parseChokepoint = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      date: feature.attributes.date,
      portid: feature.attributes.portid,
      portname: feature.attributes.portname,
      n_container: parseInt(feature.attributes.n_container),
      n_dry_bulk: parseInt(feature.attributes.n_dry_bulk),
      n_general_cargo: parseInt(feature.attributes. n_general_cargo),
      n_roro: parseInt(feature.attributes.n_roro),
      n_tanker: parseInt(feature.attributes.n_tanker),
      n: parseInt(feature.attributes.n_total),
      capacity: parseFloat(feature.attributes.capacity),
    };
    return datapoint;
  });

  series.sort((a, b) => a.date - b.date);
  return series;
};


var parseCountry = function (features) {
  var series = features.map((feature) => {
    datapoint = {
      date: Date.parse(feature.attributes.date),
      country: feature.attributes.country,
      ISO3: feature.attributes.ISO3,
      portcalls_container: parseInt(feature.attributes.portcalls_container),
      portcalls_dry_bulk: parseInt(feature.attributes.portcalls_dry_bulk),
      portcalls_general_cargo: parseInt(feature.attributes.portcalls_general_cargo),
      portcalls_roro: parseInt(feature.attributes.portcalls_roro),
      portcalls_tanker: parseInt(feature.attributes.portcalls_tanker),
      portcalls: parseInt(feature.attributes.portcalls),

      import_container: parseInt(feature.attributes.import_container),
      import_dry_bulk: parseInt(feature.attributes.import_dry_bulk),
      import_general_cargo: parseInt(feature.attributes.import_general_cargo),
      import_roro: parseInt(feature.attributes.import_roro),
      import_tanker: parseInt(feature.attributes.import_tanker),
      import: parseFloat(feature.attributes.import),

      export_container: parseInt(feature.attributes.export_container),
      export_dry_bulk: parseInt(feature.attributes.export_dry_bulk),
      export_general_cargo: parseInt(feature.attributes.export_general_cargo),
      export_roro: parseInt(feature.attributes.export_roro),
      export_tanker: parseInt(feature.attributes.export_tanker),
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
        parseFloat(feature.attributes.portcalls_container_15MA_yoy_doy) * 100,
      portcalls_container_30MA_yoy:
        parseFloat(feature.attributes.portcalls_container_30MA_yoy_doy) * 100,
      shipment_container_30MA_yoy:
        parseFloat(feature.attributes.shipment_30MA_yoy_doy) * 100,
      import_container_30MA_yoy:
        parseFloat(feature.attributes.import_container_30MA_yoy_doy) * 100,
      export_container_30MA_yoy:
        parseFloat(feature.attributes.export_container_30MA_yoy_doy) * 100,
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
        portcalls_container: 0,
        portcalls_dry_bulk: 0,
        portcalls_general_cargo: 0,
        portcalls_roro: 0,
        portcalls_tanker: 0,
        portcalls: 0,
        import: 0,
        export: 0,
      };
    }
    acc[item.date]["portcalls_container"] += item.portcalls_container;
    acc[item.date]["portcalls_dry_bulk"] += item.portcalls_dry_bulk;
    acc[item.date]["portcalls_general_cargo"] += item.portcalls_general_cargo;
    acc[item.date]["portcalls_roro"] += item.portcalls_roro;
    acc[item.date]["portcalls_tanker"] += item.portcalls_tanker;
    acc[item.date]["portcalls"] += item.portcalls;
    acc[item.date]["import"] += item.import;
    acc[item.date]["export"] += item.export;
    return acc;
  }, {});

  return Object.values(reduced);
};

var generateIndicators = function (series, ma_days=7) {
  series.sort((a, b) => a.date - b.date);

  import_MA = movingAvg(
    series.map((x) => x.import),
    ma_days,
    0
  );
  export_MA = movingAvg(
    series.map((x) => x.export),
    ma_days,
    0
  );
  portcalls_MA = movingAvg(
    series.map((x) => x.portcalls),
    ma_days,
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

var generateChokepointIndicators = function (series, ma_days=7) {
  series.sort((a, b) => a.date - b.date);

  capacity_MA = movingAvg(
    series.map((x) => x.capacity),
    ma_days,
    0
  );
  n_MA = movingAvg(
    series.map((x) => x.n),
    ma_days,
    0
  );

  series = series.map(function (feature, i) {
    feature["capacity_MA"] = capacity_MA[i];
    feature["n_MA"] = n_MA[i];
    if (i > shift) {
      feature["capacity_MA_shifted"] = capacity_MA[i - shift];
      feature["n_MA_shifted"] = n_MA[i - shift];
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
    title: "Incoming Shipment",
    name: "Incoming Shipment",
  },
  export: {
    yAxis: "Metric Tons",
    title: "Outgoing Shipment",
    name: "Outgoing Shipment",
  },
  importN: {
    yAxis: "3-month moving average, year on year change (%)",
    title: "Nowcast Estimate of Import Value and Volume",
  },
  exportN: {
    yAxis: "3-month moving average, year on year change (%)",
    title: "Nowcast Estimate of Export Value and Volume",
  },
  n: {
    yAxis: "Number of Ships",
    title: "Arrivals of Ships",
  },
  capacity: {
    yAxis: "Metric Tons",
    name: "Transit Trade Volume",
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

  tooltip: {
    format: '<span style="font-size: 0.8em">{key}</span><br/>' +
        '{#each points}' +
        '<span style="color:{color}">\u25CF</span> ' +
        '{series.name}: <b>{y}</b><br/>' +
        '{/each}',
    shared: true
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

  responsive: {
    rules: [{
      condition: {
        maxWidth: 500
      },
      chartOptions: {
        legend: {
          align: 'center',
          verticalAlign: 'bottom',
          layout: 'horizontal'
        }
      }
    }]
  }
};

var createDisruptionAisChart = function (data, chartType = "portcalls", ma_days=7) {
  options["yAxis"] = {
    title: {
      text: labels[chartType].yAxis,
    },
    opposite: false,
  };

  options.series = [

    {
      name: "Container",
      data: data.map((x) => [x.date, x[chartType+"_container"]]),
      type: "column",
      stack: 1,
      tooltip: {
        valueDecimals: 0,
      },
      color: "#D72F27",
      showInLegend: true,
    },
    {
      name: "Dry Bulk",
      data: data.map((x) => [x.date, x[chartType+"_dry_bulk"]]),
      type: "column",
      stack: 1,
      tooltip: {
        valueDecimals: 0,
      },
      color: "#FC8D58",
      showInLegend: true,
    },
    {
      name: "General Cargo",
      data: data.map((x) => [x.date, x[chartType+"_general_cargo"]]),
      type: "column",
      stack: 1,
      tooltip: {
        valueDecimals: 0,
      },
      color: "#FDDF8F",
      showInLegend: true,
    },
    {
      name: "Roll-on/roll-off",
      data: data.map((x) => [x.date, x[chartType+"_roro"]]),
      type: "column",
      stack: 1,
      tooltip: {
        valueDecimals: 0,
      },
      color: "#92BFDB",
      showInLegend: true,
    },
    {
      name: "Tanker",
      data: data.map((x) => [x.date, x[chartType+"_tanker"]]),
      type: "column",
      stack: 1,
      tooltip: {
        valueDecimals: 0,
      },
      color: "#1A4D2E",
      showInLegend: true,
    },
  ];

  options.series = options.series.concat([
    {
      name: ma_days+"-day Moving Average",
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
      name: "Prior Year: "+ma_days+"-day Moving Average",
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
    text: labels[chartType].title,
  };

  options["subtitle"] = null;

  var chart = new Highcharts.stockChart("container", options);
};


var createGrowthRateChart = function (
  data,
  chartType = "portcalls",
  gr=12
) {

  const chartTypeVar = chartType.substring(0, 6);

  options["yAxis"] = {
    gridLineColor: "#c0c0c0",
    title: {
      text: "",
    },
    opposite: false,
  };

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
    {
      name: capitalizeFirstLetter(chartTypeVar) + " Value (US Dollars)",
      data: data
        .slice(gr, data.length)
        .map((x) => [x.date, x[chartTypeVar + "_value_GR_MA"]]),
      type: "spline",
      tooltip: {
        valueDecimals: 1,
      },
      marker: {
        enabled: false,
      },
      color: "#d82214", //"#FFFFED",
      showInLegend: true,
    },
    {
      name: capitalizeFirstLetter(chartTypeVar) + " Volume (in Constant Prices)",
      data: data
        .slice(gr, data.length)
        .map((x) => [x.date, x[chartTypeVar + "_volume_GR_MA"]]),
      type: "spline",
      tooltip: {
        valueDecimals: 1,
      },
      marker: {
        enabled: false,
      },
      color: "#004b94", //"#FFFFED",
      showInLegend: true,
    },
  ];

  //console.log(options);

  options["title"] = {
    text: labels[chartType].title,
  };

  options["subtitle"] = {
    text: labels[chartType].yAxis,
    align: "left",
    x: 25,
  };

  var chart = new Highcharts.Chart("container", options);

  return options;
};


var createAisYoYChart = function (data, chartType = "portcalls") {
  Jan1 = new Date("2025-01-01").getTime();
  Apr2 = new Date("2025-04-02").getTime();
  console.log("Jan1", Jan1);
  console.log("Apr2", Apr2);

  titleTypeName = chartType == "portcalls" ? "Port Calls" : "Shipment";
  titleTypeName =
    chartType == "import" ? "Incoming " + titleTypeName : titleTypeName;
  titleTypeName =
    chartType == "export" ? "Outgoing " + titleTypeName : titleTypeName;
  yTypeName = chartType == "portcalls" ? "Number of vessels" : "Metric tons";

  options["title"] = {
    text: data[0].country + ": " + titleTypeName + " by Container Ships",
  };
  options["subtitle"] = {
    text: "(" + yTypeName + ", year on year % change)",
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
    selected: 2,
  };

  options.series = [
    {
      name: "30-day Moving Average",
      data: data
        .filter((x) => x.date >= new Date("2020-01-01").getTime())
        .map((x) => [x.date, x[chartType + "_container_30MA_yoy"]]),
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
  ];

  var chart = new Highcharts.stockChart("container", options);
};
