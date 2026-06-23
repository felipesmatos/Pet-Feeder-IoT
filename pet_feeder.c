#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <HX711.h>

// =====================
// WIFI
// =====================
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// =====================
// TAGOIO
// =====================
const char* TOKEN = "";

unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 1000;

// =====================
// HARDWARE
// =====================

// HX711 Ração
#define DT_RACAO 33
#define SCK_RACAO 34

// HX711 Água
#define DT_AGUA 26
#define SCK_AGUA 21

#define PINO_SERVO 17
#define RELE_BOMBA 16

HX711 balancaRacao;
HX711 balancaAgua;

const float FATOR = 42.0;

int leitura;

float racao;
float agua;

float agua_liberada;
float racao_liberada;

float racao_consumida;
float agua_consumida;

float doseRacao = 40.0; // para testes

bool alimentando = true;
bool hidratando = true;

Servo servoRacao;

// =====================
// CONTROLE
// =====================

void conectarWiFi() {

  Serial.print("Conectando ao WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void enviarTelemetriaRacao() {

  if (WiFi.status() != WL_CONNECTED)
    return;

  racao_consumida = racao_liberada - racao;

  if(racao_consumida < 0)
    racao_consumida = 0;

  HTTPClient http;

  http.begin("https://api.tago.io/data");

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Device-Token", TOKEN);

  String payload = "[";

  payload += "{\"variable\":\"racao_liberada\",\"value\":";
  payload += String(racao_liberada, 2);
  payload += "},";

  payload += "{\"variable\":\"racao_consumida\",\"value\":";
  payload += String(racao_consumida, 2);
  payload += "}";

  payload += "]";

  http.POST(payload);

  http.end();
}

void enviarTelemetriaAgua() {

  if (WiFi.status() != WL_CONNECTED)
    return;

  agua_consumida = agua_liberada - agua;

  if(agua_consumida < 0)
    agua_consumida = 0;

  HTTPClient http;

  http.begin("https://api.tago.io/data");

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Device-Token", TOKEN);

  String payload = "[";

  payload += "{\"variable\":\"agua_liberada\",\"value\":";
  payload += String(agua_liberada, 2);
  payload += "},";

  payload += "{\"variable\":\"agua_consumida\",\"value\":";
  payload += String(agua_consumida, 2);
  payload += "}";

  payload += "]";

  http.POST(payload);

  http.end();
}

float lerPesoRacao() {

  long leitura = balancaRacao.read();
  return (leitura / FATOR) / 10;
}

int lerPesoAgua() {

  long leitura = balancaAgua.read();
  return (leitura / FATOR) / 10;
}

void alimentar(int peso){
  if(peso < doseRacao){
    servoRacao.write(70);
    delay(1500);
  }
  else if((peso >= (doseRacao * 0.8)) && (peso < doseRacao)){

    servoRacao.write(45);
    delay(1000);
    //racao_liberada = peso;

  }else{
    servoRacao.write(0);
    racao_liberada = peso;
    alimentando = false;
  }

}

void Bomba(float litros){
  if(litros < 25){
    digitalWrite(RELE_BOMBA, HIGH);
    delay(2000);
    digitalWrite(RELE_BOMBA, LOW);
  }else{
    agua_liberada = litros;
    hidratando = false;
    Serial.println("refil de água");
  }
}

void setup() {

  Serial.begin(115200);

  conectarWiFi();
  pinMode(RELE_BOMBA, OUTPUT);

  digitalWrite(RELE_BOMBA, LOW);

  balancaRacao.begin(DT_RACAO, SCK_RACAO);
  balancaAgua.begin(DT_AGUA, SCK_AGUA);

  servoRacao.attach(PINO_SERVO);

  servoRacao.write(0);

  Serial.println("Sistema iniciado");
}

void loop() {

  racao = lerPesoRacao();
  Serial.print("racao: ");
  Serial.print(racao);
  Serial.println("kg");

  agua = lerPesoAgua();
  Serial.print("agua:");
  Serial.print(agua);
  Serial.println("kg");


  if(alimentando){
    alimentar(racao);
  }


  if(hidratando){
    Bomba(agua);
  }
  

  if (millis() - ultimoEnvio >= intervaloEnvio) {
    ultimoEnvio = millis();

    if(!alimentando){
      enviarTelemetriaRacao();
    }

    if(!hidratando){
      enviarTelemetriaAgua();
    }
  }
  delay(500);
}
