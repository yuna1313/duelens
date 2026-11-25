package com.duelens;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import com.duelens.common.ApiException;
import com.duelens.security.SessionRateLimiter;

class SessionRateLimiterTests {
    @Test
    void newSessionLimitResetsAfterWindowAndDoesNotTrustAnotherAddress() {
        var clock = new MutableClock();
        var limiter = new SessionRateLimiter(2, clock);
        limiter.acquire("one");
        limiter.acquire("one");
        assertThatThrownBy(() -> limiter.acquire("one")).isInstanceOf(ApiException.class);
        limiter.acquire("two");
        clock.now = clock.now.plusSeconds(60);
        limiter.acquire("one");
    }

    @Test
    void unknownAddressesCannotGrowLimiterBeyondItsBound() {
        var clock = new MutableClock();
        var limiter = new SessionRateLimiter(60, clock);
        for (int index = 0; index < 4096; index++) limiter.acquire("address-" + index);
        assertThatThrownBy(() -> limiter.acquire("overflow")).isInstanceOf(ApiException.class);
        clock.now = clock.now.plusSeconds(60);
        limiter.acquire("overflow");
    }

    private static class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-11-25T00:00:00Z");
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}
