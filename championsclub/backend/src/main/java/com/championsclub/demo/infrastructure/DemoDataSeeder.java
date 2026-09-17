package com.championsclub.demo.infrastructure;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.admin.application.ConfigurationStore.*;
import com.championsclub.points.domain.PointTransactionType;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.sales.application.SaleRepository;
import com.championsclub.sales.domain.Sale;
import com.championsclub.targets.application.TargetStore;
import com.championsclub.users.application.*;
import com.championsclub.users.domain.UserRole;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
@ConditionalOnProperty(name="championsclub.demo.enabled",havingValue="true")
class DemoDataSeeder implements ApplicationRunner {
    private final UserStore users;
    private final ConfigurationStore configuration;
    private final SaleRepository sales;
    private final PointsLedger points;
    private final TargetStore targets;
    private final JdbcTemplate database;
    private final PasswordEncoder encoder;
    private final String password;
    DemoDataSeeder(UserStore users,ConfigurationStore configuration,SaleRepository sales,PointsLedger points,TargetStore targets,
                   JdbcTemplate database,PasswordEncoder encoder,@Value("${championsclub.demo.password}") String password) {
        this.users=users; this.configuration=configuration; this.sales=sales; this.points=points; this.targets=targets;
        this.database=database; this.encoder=encoder; this.password=password;
    }
    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        database.execute("select pg_advisory_xact_lock(724315)");
        if (database.queryForObject("select count(*) from users",Long.class)>0) return;
        int bytes=password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        if (bytes<12 || bytes>72) throw new IllegalStateException("Demo password must contain between 12 and 72 UTF-8 bytes.");
        String hash=encoder.encode(password);
        var north=configuration.saveDealership(null,new DealershipData(null,"Capital North","NORTH","Cluj-Napoca","North West",true));
        var south=configuration.saveDealership(null,new DealershipData(null,"Mobility South","SOUTH","Bucharest","South",true));
        var west=configuration.saveDealership(null,new DealershipData(null,"Financial West","WEST","Timisoara","West",true));
        var admin=account("John","Doe",UserRole.ADMIN,null,hash);
        var jane=account("Jane","Doe",UserRole.SALES_ADVISOR,north.id(),hash);
        account("Alex","Smith",UserRole.MANAGER,north.id(),hash);
        var emma=account("Emma","Taylor",UserRole.SALES_ADVISOR,north.id(),hash);
        var daniel=account("Daniel","Brown",UserRole.SALES_ADVISOR,north.id(),hash);
        var morgan=account("Morgan","Lee",UserRole.SALES_ADVISOR,south.id(),hash);
        account("Jordan","Brown",UserRole.MANAGER,south.id(),hash);
        var casey=account("Casey","Miller",UserRole.SALES_ADVISOR,west.id(),hash);
        account("Taylor","Wilson",UserRole.MANAGER,west.id(),hash);
        var products=List.of(
                configuration.saveProduct(null,new ProductData(null,"Classic Financing","FINANCE","Eligible vehicle financing",true,true)),
                configuration.saveProduct(null,new ProductData(null,"Leasing Plus","LEASE","Eligible leasing agreements",true,true)),
                configuration.saveProduct(null,new ProductData(null,"Service Protection","PROTECT","Eligible service protection",true,true)));
        LocalDate today=LocalDate.now();
        for (var product : products) configuration.saveRule(null,new RuleData(null,product.id(),150+(int)(product.id()%3)*50,
                BigDecimal.valueOf(500),today.minusYears(2),today.plusYears(2),true));
        configuration.saveReward(null,new RewardData(null,"Fuel Voucher","Mobility","Internal demonstration voucher",650,50,null,true));
        configuration.saveReward(null,new RewardData(null,"Technology Voucher","Lifestyle","Internal demonstration voucher",2200,25,null,true));
        configuration.saveReward(null,new RewardData(null,"Travel Voucher","Travel","Internal demonstration voucher",6000,5,null,true));
        var advisors=List.of(jane,emma,daniel,morgan,casey);
        for (int index=0;index<advisors.size();index++) {
            var advisor=advisors.get(index);
            history(advisor,products,index,today);
            target(advisor.id(),TargetStore.OwnerType.ADVISOR,BigDecimal.valueOf(180000+index*30000),admin.id(),today);
        }
        target(north.id(),TargetStore.OwnerType.DEALERSHIP,BigDecimal.valueOf(630000),admin.id(),today);
        target(south.id(),TargetStore.OwnerType.DEALERSHIP,BigDecimal.valueOf(270000),admin.id(),today);
        target(west.id(),TargetStore.OwnerType.DEALERSHIP,BigDecimal.valueOf(300000),admin.id(),today);
    }
    private UserAccount account(String first,String last,UserRole role,Long dealershipId,String hash) {
        return users.save(null,new UserStore.UserChange(first,last,(first+"."+last+"@championsclub.example").toLowerCase(Locale.ROOT),
                role,dealershipId,true,null),hash);
    }
    private void target(long id,TargetStore.OwnerType type,BigDecimal amount,long actor,LocalDate today) {
        LocalDate start=today.withDayOfMonth(1);
        targets.save(null,new TargetStore.TargetData(null,type,id,start,start.plusMonths(1).minusDays(1),amount,"EUR",true),actor);
    }
    private void history(UserAccount advisor,List<ProductData> products,int index,LocalDate today) {
        for (int day=179;day>=0;day--) {
            LocalDate date=today.minusDays(day);
            if (date.getDayOfWeek()==DayOfWeek.SUNDAY || date.getDayOfWeek()==DayOfWeek.SATURDAY) continue;
            if (index==2 && day<12 && day%3!=0) continue;
            int productIndex=Math.floorMod(day+index,products.size());
            long amount=5000+index*900L+(179-day)*18L+date.getDayOfWeek().getValue()*310L;
            if (day>35 && day<49) amount=amount*7/10;
            if (index==0 && day==4) amount*=3;
            var product=products.get(productIndex);
            BigDecimal money=BigDecimal.valueOf(amount);
            int award=configuration.activeRule(product.id(),date).map(rule -> rule.toDomain().award(product.eligible(),money,date)).orElse(0);
            var sale=sales.save(Sale.builder().advisorId(advisor.id()).dealershipId(advisor.dealershipId()).productId(product.id())
                    .externalReference("SYNTHETIC-"+advisor.id()+"-"+date).currency("EUR").financedAmount(money)
                    .saleDate(date).awardedPoints(award).build());
            points.append(advisor.id(),PointTransactionType.SALE_EARNED,award,sale.id(),"Synthetic historical sale award");
        }
    }
}
