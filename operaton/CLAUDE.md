# operaton (proces BPMN)

Java 21, Spring Boot + Operaton (`operaton-bpm-spring-boot-starter-webapp` + `-rest`). Przykład triage wniosku kredytowego: credit-score → DMN (`risk-assessment.dmn`) → routing BPMN (`loan-application.bpmn`) → auto-approve / human task (underwriter) / auto-reject.

## Cockpit i Tasklist już istnieją — nie odtwarzaj ich

`operaton-bpm-spring-boot-starter-webapp` wystawia gotowe UI pod `/operaton/app/cockpit` i `/operaton/app/tasklist` (login `demo/demo`). Panel `admin/` tylko do nich linkuje (nowa karta), nie ma własnych ekranów procesu/zadań — i tak ma zostać.

## BPMN/DMN to XML

`src/main/resources/loan-application.bpmn`, `risk-assessment.dmn` — edytuj przez Operaton Modeler (desktopowa appka Electron, MIT, nie hostuje się jako web — patrz root README/historia dyskusji) albo bardzo ostrożnie ręcznie. Nie generuj tych plików od zera bez potrzeby.

## Konfiguracja przez env vary (docker-compose) / application.yaml (lokalnie)

Spring relaxed binding: `application.yaml` ma klucze typu `credit.score.service.url`, `ecm.adapter.url`, `spring.kafka.bootstrap-servers` — w compose nadpisywane przez `CREDIT_SCORE_SERVICE_URL`, `ECM_ADAPTER_URL`, `SPRING_KAFKA_BOOTSTRAP_SERVERS` itd. (nazwy serwisów compose, np. `kafka:9092`, `wiremock:8080`, `mailpit`).

## Delegaty i ECM

`delegate/` — `CreditScoreDelegate`, `NotificationDelegate`, `RejectionEmailDelegate`, `SaveDataDelegate`. `ecm/` — symulacja ECM (Document, DocumentController/Service/Repository) + `DocumentEventPublisher` publikujący do Kafki (topic `ecm.document.events`), konsumowany przez `ecm-adapter/`.

## Testy

`LoanApplicationIT` (Testcontainers: Postgres + WireMock) — `./mvnw verify` albo `./gradlew build`. To jedyny moduł z testami na razie (patrz root `ROADMAP.md`).
