
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