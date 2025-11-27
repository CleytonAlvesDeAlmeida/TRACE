# T.R.A.C.E. (Tecnologia para Rastreamento de Ambiente de Coleta Eletrônica)

## 🚀 Como Executar Localmente

Este projeto é desenvolvido com HTML, CSS e JavaScript puro. Devido à política de segurança do navegador (CORS) que impede o carregamento de arquivos JSON locais (`fetch`) diretamente de um arquivo `index.html` aberto no sistema de arquivos (`file://`), é necessário executar um servidor web local simples.

### Opção 1: Usando Python (Recomendado)

1.  **Navegue** até a pasta raiz do projeto (`/trace/`) no seu terminal.
2.  **Execute** o comando:
    ```bash
    python3 -m http.server 8000
    ```
    (Ou `python -m SimpleHTTPServer 8000` se estiver usando Python 2).
3.  **Abra** seu navegador e acesse: `http://localhost:8000`

### Opção 2: Extensão Live Server (VS Code)

Se você utiliza o VS Code, a extensão **Live Server** (do Ritwick Dey) pode ser usada para abrir o projeto em um servidor local.

## Estrutura do Projeto

* **index.html**: Página principal da aplicação.
* **css/styles.css**: Estilos visuais e responsividade.
* **data/pontos.json**: Dados dos pontos de coleta.
* **js/**: Contém a lógica de aplicação.
    * `app.js`: Inicialização e controle de UI.
    * `map.js`: Integração com o OpenStreetMap (Leaflet).
    * `utils.js`: Funções de utilidade (cálculo de distância).

## Requisitos de Imagens

As imagens de exemplo no JSON (`exemplo1.jpg`, etc.) e os ícones de marcador (`marker-*.png`) devem ser incluídas na pasta `assets/images/` para que a aplicação funcione corretamente.
