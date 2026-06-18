# 🐾 Pet Feeder Inteligente IoT

## 📋 Sobre o Projeto

Considerando a dinâmica da vida urbana é póssível perceber que passamos cada vez mais tempo longe de casa e por sua vez longe de nossos animais de estimação, por tanto, o presente projeto buscar não só servir como um alimentador autônomo, mas também como uma ferramenta que nos aproxima de quem queremos tanto cuidar, mesmo à distância.

## 🎯 Objetivos

* Automatizar a alimentação de animais domésticos.
* Permitir acompanhamento remoto via Internet.
* Registrar dados para análise do consumo do animal.

## 🛠️ Componentes Utilizados

| Componente            | Quantidade |
| --------------------- | ---------- |
| ESP32                 | 1          |
| Módulo HX711          | 2          |
| Célula de carga       | 2          |
| Servo Motor SG90      | 2          |
| Módulo Relé           | 1          |
| Bomba de água DC      | 1          |
| Fonte de alimentação  | 1          |
| Reservatório de ração | 1          |
| Reservatório de água  | 1          |

## 🏗️ Arquitetura do Sistema

                    Interface web
                         ▲
                         │
                       Wi-Fi
                         │
                         ▼
                       ESP32
                  ┌──────┼──────┐
                  │             │
                  ▼             ▼
               HX711         HX711
                 │             │
                 ▼             ▼
              Ração         Água

                  ┌──────┼──────┐
                  │             │
                  ▼             ▼
              Servo          Relé
                  │             │
                  ▼             ▼
         Dispensador      Bomba d'água
            de ração

## ☁️ Comunicação IoT

O ESP32 conecta-se à rede Wi-Fi, envia e recebe dados utilizando requisições HTTP.

Dados enviados:

* Peso da ração dispensada no pote (g)
* Quantidade de ração consumida (g)
* Peso da água dispensada no pote (l)
* Quantidade de água consumida (l)

Dados recebidos:

* Quantidade de ração a ser liberada (g)
* confirmação para liberar ração (bool)

## 📊 Dashboard

dashboards a serem mostrados ao usuário:

* Nível de ração liberada e consumida ao longo do tempo.
* Nível de água liberada e consumida ao longo do tempo.

## 📚 Tecnologias/Conceitos Utilizadas

* C++
* ESP32
* Arduino Framework
* IoT
* Wi-Fi
* HTTP REST
* TagoIO (para prototipar dashboards e conexão http)

## Autor

Desenvolvido por **Felipe Silva Matos** como projeto na cadeira de Internet das Coisas (IoT), do Instituto Federal do Maranhão (IFMA).
