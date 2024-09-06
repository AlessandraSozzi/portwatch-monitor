const shift = 12; // Changed from 52*7: 52*7days - to keep comparing mondays with mondays, tuesdays with tuesdays, etc

var downloadSymbol = function(x, y, w, h) {
    const path = [
        // Arrow stem
        'M', x + w * 0.5, y,
        'L', x + w * 0.5, y + h * 0.7,
        // Arrow head
        'M', x + w * 0.3, y + h * 0.5,
        'L', x + w * 0.5, y + h * 0.7,
        'L', x + w * 0.7, y + h * 0.5,
        // Box
        'M', x, y + h * 0.9,
        'L', x, y + h,
        'L', x + w, y + h,
        'L', x + w, y + h * 0.9
    ];
    return path;
};

var movingAvg = function(array, countBefore, countAfter) {
    if (countAfter == undefined) countAfter = 0;
    const result = [];
    for (let i = 0; i < array.length; i++) {
      const subArr = array.slice(Math.max(i - countBefore + 1, 0), Math.min(i + countAfter + 1, array.length));
      const avg = subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
      result.push(avg);
    }
    return result;
};

var indexed = function(series, column, base=2019) {
  const values2019 = series.filter(x => x.date.getFullYear() == base).map(x => x[column]);
  const avg2019 = values2019.reduce((sum, currentValue) => sum + currentValue, 0) / values2019.length;
  return series.map(x => x[column]) / avg2019 * 100;
};

function growthRate(array, countBefore, countAfter) {
  if (countAfter == undefined) countAfter = 0;
  const result = [];
  for (let i = 0; i < array.length; i++) {
    const subArr = array.slice(Math.max(i - countBefore + 1, 0), Math.min(i + countAfter + 1, array.length));
    const growth = (subArr[subArr.length-1]/subArr[0]-1)*100;
    result.push(growth);
  }
  return result;
}


var generateData = function(features, ma=3, gr=12) {

    var series = features.map((feature) => {
        datapoint = {
          region: feature.attributes.region,
          ISO3: feature.attributes.ISO3,
          date: Date.parse(feature.attributes.date), 
          portcalls_tanker: parseInt(feature.attributes.portcalls_tanker),
          portcalls_general_cargo: parseInt(feature.attributes.portcalls_general_cargo),
          portcalls_dry_bulk: parseInt(feature.attributes.portcalls_dry_bulk),
          portcalls_roro: parseInt(feature.attributes.portcalls_roro),
          portcalls_container: parseInt(feature.attributes.portcalls_container),
          import_volume: parseFloat(feature.attributes.volume_import),
          export_volume: parseFloat(feature.attributes.volume_export),
          import_value: parseFloat(feature.attributes.value_import_total),
          export_value: parseFloat(feature.attributes.value_export_total)
        }

        datapoint['portcalls'] = (datapoint['portcalls_tanker']+
                                  datapoint['portcalls_general_cargo']+
                                  datapoint['portcalls_dry_bulk']+
                                  datapoint['portcalls_roro']+
                                  datapoint['portcalls_container'])

        return datapoint;
    });
  
    series.sort((a, b) => a.date - b.date);

    import_value_MA = movingAvg(series.map(x => x.import_value), ma, 0);
    export_value_MA = movingAvg(series.map(x => x.export_value), ma, 0);
    import_volume_MA = movingAvg(series.map(x => x.import_volume), ma, 0);
    export_volume_MA = movingAvg(series.map(x => x.export_volume), ma, 0);
    portcalls_MA = movingAvg(series.map(x => x.portcalls), ma, 0);
    import_value_GR = growthRate(series.map(x => x.import_value), gr, 0);
    export_value_GR = growthRate(series.map(x => x.export_value), gr, 0);
    import_volume_GR = growthRate(series.map(x => x.import_volume), gr, 0);
    export_volume_GR = growthRate(series.map(x => x.export_volume), gr, 0);

    series = series.map(function(feature, i) {
      feature['portcalls_MA'] = portcalls_MA[i];
      feature['import_value_MA'] = import_value_MA[i];
      feature['export_value_MA'] = export_value_MA[i];
      feature['import_volume_MA'] = import_volume_MA[i];
      feature['export_volume_MA'] = export_volume_MA[i];
      if (i > gr) {
        feature['import_value_GR'] = import_value_GR[i];
        feature['export_value_GR'] = export_value_GR[i];
        feature['import_volume_GR'] = import_volume_GR[i];
        feature['export_volume_GR'] = export_volume_GR[i];
      }
      return feature;
    });

    console.log(series);
    return series;

};

var labels = {
    portcalls: {
      yAxis: "Number of Ships",
      title: "Monthly Arrivals of Ships",
      name: "Number of Ships"
    },
    import_volume: {
      yAxis: "Index [2019 Avg. = 100]",
      title: "Monthly Import Volume",
      name: 'Import Volume'
    },
    export_volume: {
      yAxis: "Index [2019 Avg. = 100]",
      title: "Monthly Export Volume",
      name: 'Export Volume'
    },
    import_value: {
      yAxis: "Index [2019 Avg. = 100]",
      title: "Monthly Import Value",
      name: 'Import Volume'
    },
    export_value: {
      yAxis: "Index [2019 Avg. = 100]",
      title: "Monthly Export Value",
      name: 'Export Volume'
    }
};


var createChart = function(data, regionid, chartType="portcalls") {

    var options = {
    
        chart: {
          backgroundColor: '#fff',
        },
    
        credits: {
            enabled: false
        },
    
        legend: {
          enabled: true
    
        },
    
        plotOptions: {
          series: {
              dataGrouping: {
                enabled: false
              },
          },
          column: {
            stacking: 'normal'
          }
        },
    
        xAxis: {
            plotBands: []
        },
    
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    symbol: 'download',
                    text: 'Export Data'
                }
            }
        },
        series: []
    };
    
    const region = data[0].region;   
    
    console.log(chartType);
    console.log(labels);
    
    options['title'] = {
      text: region + ": " + labels[chartType].title
    };
    
    options['yAxis'] = {
      title: {
        text: labels[chartType].yAxis
      },
      opposite: false
    }

    options['xAxis'] = {
      type: 'datetime'
    }
  
    if (chartType == "portcalls") {
  
      options.series = [
        { name: "Number of Cargo Ships",
          data: data.map(x => [x.date, x['portcalls_dry_bulk']+x['portcalls_container']+x['portcalls_roro']+x['portcalls_general_cargo']]),
          type: 'column',
          stack: 1,
          tooltip: {
            valueDecimals: 0,
          },
          color: '#afc5dc',
          showInLegend: true},
      { name: "Number of Tanker Ships",
        data: data.map(x => [x.date, x['portcalls_tanker']]),
        type: 'column',
        stack: 1,
        tooltip: {
          valueDecimals: 0,
        },
        color: '#004c97',
        showInLegend: true}];
  
    } else {
      console.log(chartType);
      options.series = [{ name: chartType.replace("_", " ")+' Index',
                            data: data.map(x => [x.date, x[chartType+"_MA"]]),
                            type: 'line',
                            marker: {
                              enabled: false, // auto
                              lineWidth: 1,
                            },
                            color: '#f3ab0a',
                            tooltip: {
                                  valueDecimals: 2,
                              },
                            showInLegend: false          
                          }];
    }
  
    
  
    console.log(options);

    var chart = new Highcharts.Chart('container-'+regionid, options);
  
    return options;
  
};


/// TESTS

console.log(labels);

console.log(movingAvg([1,2,3,1,1,1], 2));

console.log(growthRate([1,2,3,1,1,1], 2));


