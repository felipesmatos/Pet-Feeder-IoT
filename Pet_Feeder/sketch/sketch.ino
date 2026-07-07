#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// =====================
// WIFI E SERVIDOR
// =====================
const char* ssid = "Wokwi-GUEST";
const char* password = "";

String serverUrl = "https://teste-pet-wheat.vercel.app"; 

unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 4000; // Envia dados a cada 4 segundos para bater com o Frontend

// =====================
// PINOS DOS SENSORES
// =====================

// Ração
float racaoReservatorio;
float racaoPote;

// Água
float aguaReservatorio;
float aguaPote;

#define PINO_SERVO 17
#define RELE_BOMBA 16

HX711 balancaReservatorio;
HX711 balancaPote;

// Reservatório
#define DT_RESERVATORIO 33
#define SCK_RESERVATORIO 34

// Pote
#define DT_POTE 26
#define SCK_POTE 21

#define TRIG_POTE 18
#define ECHO_POTE 19

#define TRIG_RESERVATORIO 4
#define ECHO_RESERVATORIO 5

// =====================
// Calibração dos Ultrassônicos
// =====================
#define DISTANCIA_RESERVATORIO 10.0 // cm
#define DISTANCIA_POTE 10.0         // cm

#define VOLUME_RESERVATORIO 500.0   // mL
#define VOLUME_POTE 300.0           // mL

// =====================
// VARIÁVEIS GERAIS
// =====================
bool alimentando = true;
bool hidratando = true;
float metaRacao = 0.00;
float metaAgua = 0.00;

const float FATOR = 42.0;

float agua_liberada = 0;
float racao_liberada = 0;
float racao_consumida = 0;
float agua_consumida = 0;

Servo servoRacao;

// =====================
// FUNÇÕES DE CONEXÃO E API
// =====================

void conectarWiFi() {
  Serial.print("Conectando ao WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void enviarTelemetria() {
  if (WiFi.status() != WL_CONNECTED) return;

  // Atualiza os consumos
  racao_consumida = racao_liberada - racaoPote;
  if(racao_consumida < 0) racao_consumida = 0;

  agua_consumida = agua_liberada - aguaPote;
  if(agua_consumida < 0) agua_consumida = 0;

  HTTPClient http;
  String url = serverUrl + "/api/telemetria";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Cria o JSON com a biblioteca
  StaticJsonDocument<256> doc;
  doc["agua_liberada"] = agua_liberada;
  doc["agua_consumida"] = agua_consumida;
  doc["racao_liberada"] = racao_liberada;
  doc["racao_consumida"] = racao_consumida;
  doc["nivel_racao_reserva"] = racaoReservatorio;
  doc["nivel_agua_reserva"] = aguaReservatorio / 1000.0; // Converte mL para Litros

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    Serial.println("Telemetria enviada com sucesso!");
  } else {
    Serial.print("Erro no envio da telemetria: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void receberComandos() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  String url = serverUrl + "/api/comandos?t=" + String(millis());
  
  http.begin(client, url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    // TEXTO DE DIAGNÓSTICO
    Serial.print("Payload do Vercel: ");
    Serial.println(payload);
    
    StaticJsonDocument<384> doc; 
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      alimentando = doc["alimentando"].as<bool>();
      hidratando = doc["hidratando"].as<bool>();
      
      if (alimentando) {
        metaRacao = doc["quantidade_racao"].as<float>();
        Serial.print("===> SUCESSO! NOVA META DE RAÇÃO: ");
        Serial.print(metaRacao);
        Serial.println("g <===");
      }
      
      if (hidratando) {
        metaAgua = doc["quantidade_agua"].as<float>();
      }
    } else {
      Serial.print("Erro ao decodificar o JSON: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("Erro HTTP ao buscar comandos. Código: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void atualizarStatusAtuadores() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Necessário para a Vercel

  HTTPClient http;
  String url = serverUrl + "/api/comandos";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  // Prepara o JSON com o estado atualizado (que agora é false)
  StaticJsonDocument<256> doc;
  doc["alimentando"] = alimentando;
  doc["hidratando"] = hidratando;

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    Serial.println("Aviso enviado: Banco de dados atualizado para Desligado!");
  } else {
    Serial.print("Erro ao avisar o banco de dados: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// =====================
// FUNÇÕES DE SENSORES
// =====================

float lerRacaoReservatorio(){
  long leitura = balancaReservatorio.read_average(5);
  return (leitura / FATOR)*100;
}

float lerRacaoPote(){
  long leitura = balancaPote.read_average(5);
  return (leitura / FATOR)*100;
}

float lerAgua(int trig, int echo, float distanciaVazio, float volumeMaximo) {
  float somaDistancias = 0;
  for (int i = 0; i < 5; i++) {
    digitalWrite(trig, LOW);
    delayMicroseconds(2);
    digitalWrite(trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(trig, LOW);

    long duracao = pulseIn(echo, HIGH, 30000);
    if (duracao == 0) continue;

    float distancia = duracao * 0.0343 / 2.0;
    somaDistancias += distancia;
    delay(20);
  }

  float distanciaMedia = somaDistancias / 5.0;
  distanciaMedia = constrain(distanciaMedia, 0.0, distanciaVazio);

  float nivel = distanciaVazio - distanciaMedia;
  return (nivel / distanciaVazio) * volumeMaximo;
}

// =====================
// FUNÇÕES DE ATUADORES
// =====================

void alimentar(float pesoAtual){
  if(pesoAtual < metaRacao){
    servoRacao.write(70);
    delay(1500);
  }
  else if((pesoAtual >= (metaRacao * 0.8)) && (pesoAtual < metaRacao)){
    servoRacao.write(45);
    delay(1000);
  } else {
    servoRacao.write(0);
    racao_liberada = pesoAtual;
    alimentando = false; // Desliga no ESP32
    Serial.println("Ração finalizada. Avisando o servidor...");
    atualizarStatusAtuadores(); // <--- Avisa o banco de dados!
  }
}

void ligarBomba(float nivelAtual){
  if(nivelAtual < metaAgua){
    digitalWrite(RELE_BOMBA, HIGH);
    delay(2000); // Liga por 2 segundos e avalia
    digitalWrite(RELE_BOMBA, LOW);
  } else {
    agua_liberada = nivelAtual;
    hidratando = false; // Desliga no ESP32
    Serial.println("Água finalizada. Avisando o servidor...");
    atualizarStatusAtuadores(); // <--- Avisa o banco de dados!
  }
}

// =====================
// SETUP E LOOP
// =====================

void setup() {
  Serial.begin(115200);

  conectarWiFi();
  
  pinMode(RELE_BOMBA, OUTPUT);
  digitalWrite(RELE_BOMBA, LOW);
  
  pinMode(TRIG_RESERVATORIO, OUTPUT);
  pinMode(ECHO_RESERVATORIO, INPUT);
  pinMode(TRIG_POTE, OUTPUT);
  pinMode(ECHO_POTE, INPUT);

  balancaReservatorio.begin(DT_RESERVATORIO, SCK_RESERVATORIO);
  balancaPote.begin(DT_POTE, SCK_POTE);

  servoRacao.attach(PINO_SERVO);
  servoRacao.write(0);

  Serial.println("Sistema iniciado e pronto!");
}

void loop() {
  racaoReservatorio = lerRacaoReservatorio();
  Serial.print("racao: ");
  Serial.print(racaoReservatorio);
  Serial.println("g");

  racaoPote = lerRacaoPote();
  Serial.print("racao: ");
  Serial.print(racaoPote);
  Serial.println("g");

  Serial.print("racao: ");
  Serial.print(metaRacao);
  Serial.println("g");

  Serial.print("racao: ");
  Serial.print(metaAgua);
  Serial.println("g");
  /*
  aguaReservatorio = lerAgua(TRIG_RESERVATORIO, ECHO_RESERVATORIO, 10.0, 500.0);
  Serial.print("agua:");
  Serial.print(aguaReservatorio);
  Serial.println("ml");

  aguaPote = lerAgua(TRIG_RESERVATORIO, ECHO_RESERVATORIO, 10.0, 500.0);
  Serial.print("agua:");
  Serial.print(aguaPote);
  Serial.println("ml"); */

  if(alimentando){
    Serial.println("Atuando: Liberando Ração...");
    alimentar(racaoPote);
  }

  if(hidratando){
    Serial.println("Atuando: Liberando Água...");
    ligarBomba(aguaPote);
  }

  if (millis() - ultimoEnvio >= intervaloEnvio) {
    ultimoEnvio = millis();
    
    // Verifica se a interface mandou algum comando novo
    receberComandos();
    
    // Envia os dados atuais para atualizar o painel visual
    enviarTelemetria();
  }
  
  delay(500);
}