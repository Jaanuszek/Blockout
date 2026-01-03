# Blackout - 3D Tetris Game

## Struktura Projektu

### Pliki Główne

- **main.ts** - Punkt wejścia aplikacji, inicjalizacja renderera, sceny i pętli gry
- **Scene.ts** - Główna scena gry, koordynuje wszystkie komponenty
- **camera.ts** - Kamera gry z możliwością sterowania
- **inputManager.ts** - Zarządzanie wejściem klawiatury dla kamery

### Moduły Gry

#### Grid.ts
Zarządza siatką 3D gry:
- Konwersja między pozycjami świata a indeksami siatki
- Sprawdzanie kolizji i granic
- Wykrywanie wypełnionych warstw
- Czyszczenie warstw

#### GameState.ts  
Zarządza stanem gry:
- Wynik gracza
- Status gry (uruchomiona/zatrzymana)
- Włączenie/wyłączenie ruchu
- Liczniki czasu i kroków

#### ScoreUI.ts
Obsługuje interfejs użytkownika wyniku:
- Tworzenie elementu DOM wyniku
- Aktualizacja wyświetlanego wyniku

#### RotationController.ts
Zarządza rotacją bloków:
- Walidacja rotacji (sprawdzanie kolizji i granic)
- Animacja rotacji z easingiem
- Obliczanie nowych pozycji po rotacji

#### BlockRenderer.ts
Renderuje bloki 3D:
- Tworzenie bloków ruchomych (wireframe)
- Tworzenie bloków osadzonych (kolorowe)
- Gradient kolorów w zależności od głębokości
- Konwersja bloków między stanami

#### BlockManager.ts (blocks.ts)
Zarządza kształtami bloków:
- 21 predefiniowanych kształtów bloków
- Losowy wybór bloków
- Tablice 3D reprezentujące kształty

## Sterowanie

### Ruch Bloków
- **Strzałki** - Ruch w płaszczyźnie XY
- **Spacja** - Hard drop (upuszczenie na dół)
- **R** - Reset gry

### Rotacja Bloków
- **Q/A** - Rotacja wokół osi X
- **W/S** - Rotacja wokół osi Y  
- **E/D** - Rotacja wokół osi Z

### Kamera
- **I/K** - Ruch kamery góra/dół
- **J/L** - Ruch kamery lewo/prawo

## Mechanika Gry

1. Bloki spadają automatycznie w kierunku Z (głębokość)
2. Gracz może obracać i przesuwać bloki
3. Gdy blok uderza w podłoże lub inny blok, zostaje osadzony
4. Wypełnione warstwy są usuwane, a bloki powyżej spadają
5. Gra kończy się, gdy nowy blok koliduje z już osadzonymi blokami
6. Punkty: 100 za każdą usuniętą warstwę

## Architektura

Projekt wykorzystuje podejście object-oriented z separacją odpowiedzialności:

- **Separation of Concerns** - Każda klasa ma jedną, jasno określoną odpowiedzialność
- **Dependency Injection** - Komponenty otrzymują zależności przez konstruktor
- **Type Safety** - Pełne wykorzystanie TypeScript dla bezpieczeństwa typów
- **Clean Code** - Czytelne nazwy, małe funkcje, jasna struktura
