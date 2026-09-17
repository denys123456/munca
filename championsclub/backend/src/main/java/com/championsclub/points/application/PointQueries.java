package com.championsclub.points.application;
import com.championsclub.points.domain.PointTransactionType;
import java.time.Instant;
import org.springframework.data.domain.*;
public interface PointQueries {
    Page<Transaction> history(long advisorId,Pageable page);
    record Transaction(long id,PointTransactionType type,int amount,long sourceId,String description,Instant createdAt) {}
}
