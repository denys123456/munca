package com.championsclub.analytics.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface MlForecastClient {

    Optional<SalesForecast> forecastSales(Long entityId, List<BigDecimal> historicalSales, BigDecimal target, int forecastHorizonDays);
}

