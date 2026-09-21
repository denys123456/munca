package com.championsclub.security.application;

import com.championsclub.users.application.UserAccount;

public interface Access {
    UserAccount current();
    void advisor(long advisorId);
    void dealership(long dealershipId);
    void self(long userId);
    void manager();
}
