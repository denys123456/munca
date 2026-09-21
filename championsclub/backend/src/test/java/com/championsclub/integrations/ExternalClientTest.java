package com.championsclub.integrations;
import com.championsclub.ai.application.*;
import com.championsclub.ai.infrastructure.OpenAiClient;
import com.championsclub.analytics.application.*;
import com.championsclub.analytics.infrastructure.FastApiMlForecastClient;
import com.championsclub.targets.application.TargetStore.OwnerType;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sun.net.httpserver.HttpServer;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import static org.assertj.core.api.Assertions.*;
class ExternalClientTest {
    private HttpServer server;
    private ExecutorService executor;
    private String body;
    private int status;
    private boolean slow;
    private String requestBody;
    private final ObjectMapper json=new ObjectMapper().registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    @BeforeEach void start() throws Exception {
        server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        executor=Executors.newCachedThreadPool();
        server.setExecutor(executor);
        status=200;
        server.createContext("/",exchange -> {
            requestBody=new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8);
            if (slow) {
                try { new CountDownLatch(1).await(2,TimeUnit.SECONDS); }
                catch (InterruptedException exception) { Thread.currentThread().interrupt(); }
            }
            byte[] response=body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type","application/json");
            try {
                exchange.sendResponseHeaders(status,response.length);
                exchange.getResponseBody().write(response);
            } finally { exchange.close(); }
        });
        server.start();
    }
    @AfterEach void stop() { server.stop(0); executor.shutdownNow(); }
    private String url() { return "http://127.0.0.1:"+server.getAddress().getPort(); }
    private MlForecastClient.ForecastRequest request() {
        LocalDate today=LocalDate.of(2026,9,15);
        var history=new ArrayList<MlForecastClient.DailySale>();
        for (int index=13;index>=0;index--) history.add(new MlForecastClient.DailySale(today.minusDays(index),BigDecimal.valueOf(100)));
        return new MlForecastClient.ForecastRequest(1,OwnerType.ADVISOR,today.minusDays(13),today.plusDays(1),today,history,BigDecimal.valueOf(2000));
    }
    private void forecastBody() throws Exception {
        body=json.writeValueAsString(new SalesForecast(BigDecimal.valueOf(1500),0.2,SalesTrend.STABLE,0.8,
                List.of(new MlForecastClient.DailySale(LocalDate.of(2026,9,16),BigDecimal.valueOf(100))),
                BigDecimal.valueOf(1400),BigDecimal.valueOf(1600),List.of(),"test-model"));
    }
    @Test void mlSuccess() throws Exception {
        forecastBody();
        assertThat(new FastApiMlForecastClient(url(),1,json).forecast(request())).isPresent();
        assertThat(requestBody).contains("\"asOf\":\"2026-09-15\"");
    }
    @Test void mlRejectsBadResponse() {
        body="{\"predictedEndValue\":-1}";
        assertThat(new FastApiMlForecastClient(url(),1,json).forecast(request())).isEmpty();
    }
    @Test void mlUnavailable() {
        status=503; body="{}";
        assertThat(new FastApiMlForecastClient(url(),1,json).forecast(request())).isEmpty();
    }
    @Test void mlTimeout() throws Exception {
        forecastBody(); slow=true;
        assertThat(new FastApiMlForecastClient(url(),1,json).forecast(request())).isEmpty();
    }
    private OpenAiClient ai() { return new OpenAiClient(json,url(),"test-key","test-model","OPENAI",1); }
    private AiClient.InsightRequest facts() { return new AiClient.InsightRequest("ADVISOR",Map.of("sales",10000)); }
    @Test void aiSuccessValidatesKnownContract() throws Exception {
        String insight=json.writeValueAsString(Map.of(
                "summary","Sales are recorded.",
                "whatChanged","Sales increased.",
                "whyItMatters","Target progress improved.",
                "risk","Forecast is unavailable.",
                "opportunity","Review eligible products.",
                "recommendedAction","Review the current target."
        ));
        body=json.writeValueAsString(Map.of("choices",List.of(Map.of("finish_reason","stop","message",Map.of("content",insight)))));
        assertThat(ai().generate(facts())).isPresent();
        assertThat(requestBody).contains("\"response_format\"", "\"json_schema\"", "\"store\":false");
    }

    @Test void aiRejectsUnsupportedProviderWithoutCallingRemoteService() {
        var client = new OpenAiClient(json,url(),"test-key","test-model","NOT_A_PROVIDER",1);
        assertThat(client.generate(facts())).isEmpty();
        assertThat(requestBody).isNull();
    }
    @Test void aiRejectsBadJson() {
        body="{\"choices\":[{\"finish_reason\":\"stop\",\"message\":{\"content\":\"not json\"}}]}";
        assertThat(ai().generate(facts())).isEmpty();
    }
    @Test void aiUnavailable() {
        status=503; body="{}";
        assertThat(ai().generate(facts())).isEmpty();
    }
    @Test void aiTimeout() {
        slow=true; body="{}";
        assertThat(ai().generate(facts())).isEmpty();
    }
}
