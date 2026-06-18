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

int racao;
int agua;

int racao_liberada;
float doseRacao = 40.0;

bool alimentando = true;

Servo servoRacao;

// =====================
// CONTROLE
// =====================

/*float lerPesoRacao() {

  long leitura = balancaRacao.read();

  if (leitura < 0)
    leitura = 0;

  return (leitura / FATOR) / 10;
}

float lerPesoAgua() {

  long leitura = balancaAgua.read();

  if (leitura < 0)
    leitura = 0;

  return (leitura / FATOR) / 10;
}*/

int lerPesoRacao() {

  long leitura = balancaRacao.read();

  return (leitura / FATOR) / 10;
}

int lerPesoAgua() {

  long leitura = balancaAgua.read();

  return (leitura / FATOR) / 10;
}

void alimentar(int peso){
  servoRacao.write(60);
  if(peso >= doseRacao){
    servoRacao.write(0);
    racao_liberada = peso;
    alimentando = false;
  }
  else if((peso >= (doseRacao * 0.8)) && (peso < doseRacao)){
    servoRacao.write(45);
    racao_liberada = peso;
  }
}

void Bomba(int op){
  if(op == 1){

    digitalWrite(RELE_BOMBA, HIGH);
    delay(2000);

  }else{

    digitalWrite(RELE_BOMBA, LOW);
    Serial.println("refil de água");

  }
}

void setup() {

  Serial.begin(115200);

  //conectarWiFi();
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
  Serial.println("racao");
  Serial.println(racao);
  Serial.println("kg");

  agua = lerPesoAgua();
  Serial.println("agua");
  Serial.println(agua);
  Serial.println("kg");

  if(alimentando){

    alimentar(racao);
    Serial.println("racao liberada");
    Serial.println(racao_liberada);

  } else {

    Serial.println("enviar os dados");
    delay(5000);
  }

  if(agua < 25){
    Bomba(1);
    //servoRacao.write(45);
  }
  else{
    Bomba(0);
    //servoRacao.write(0);
  }


  delay(500);
}
