package com.championsclub.admin.application;
public interface SystemHealth {
    Health status();
    record Health(String application,String database,String mlService,String aiProvider) {}
}
