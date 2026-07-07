# 🐾 Pet Feeder Inteligente

## 📋 Sobre o Projeto

Considerando a dinâmica da vida urbana é póssível perceber que passamos cada vez mais tempo longe de casa e por sua vez longe de nossos animais de estimação, por tanto, o presente projeto buscar não só servir como um alimentador autônomo, mas também como uma ferramenta que nos aproxima de quem queremos tanto cuidar, mesmo à distância. O presente projeto tem como escopo, cachorros de pequenos porte devido à fragilidade dos componentes.

## 🎯 Objetivos

* Automatizar a alimentação de animais domésticos.
* Permitir acompanhamento remoto via Internet.
* Registrar dados para análise dos níveis de ração e água.

## 🛠️ Componentes Utilizados

| Componente             | Quantidade | Função no Projeto |
| :--------------------- | :--------: | :---------------- |
| ESP32                  |     1      | Microcontrolador principal com conectividade Wi-Fi |
| Módulo HX711           |     2      | Amplificador para leitura das células de carga |
| Célula de Carga        |     2      | Medição de peso (Reservatório e Pote de Ração) |
| Sensor Ultrassônico    |     2      | Medição de nível por distância (Reservatório e Pote de Água) |
| Servo Motor SG90       |     1      | Mecanismo físico para liberação de ração |
| Módulo Relé            |     1      | Chaveamento eletrônico para controle da bomba |
| Mini Bomba de Água DC  |     1      | Atuador para bombeamento de água para o pote |
| Fonte de Alimentação   |     1      | Alimentação para a bomba de água|
| Reservatório de Ração  |     1      | Estrutura física de armazenamento de ração |
| Reservatório de Água   |     1      | Estrutura física de armazenamento de água |

## ☁️ Comunicação IoT

O ESP32 conecta-se à rede Wi-Fi, envia e recebe dados utilizando requisições HTTP.

Dados enviados:

* Peso da ração dispensada no pote (g)
* Peso da ração no reservatório (g)
* Quantidade de ração consumida (g)
* volume da água dispensada no pote (l)
* volume da água no reservatório (l)
* Quantidade de água consumida (l)
* liberação da ração (bool)
* liberação de água (bool)

Dados recebidos:

* Quantidade de ração a ser liberada (g)
* confirmação para liberar ração (bool)
* Quantidade de água a ser liberada (l)
* confirmação para liberar água (bool)

## 📊 Dashboard

dashboards a serem mostrados ao usuário:

* Nível de ração liberada e consumida ao longo do tempo.
* Nível de ração no reservatório.
* Nível de água liberada e consumida ao longo do tempo.
* Nível de água no reservatório.

## 📚 Tecnologias/Conceitos Utilizadas

* C++
* ESP32
* Arduino Framework
* IoT
* Wi-Fi
* HTTP REST
* Next js

## Autor

Desenvolvido por **Felipe Silva Matos** e apresentado à professora **Salete Silva Farias** como projeto final na cadeira de Internet das Coisas (IoT), do Instituto Federal do Maranhão (IFMA).
