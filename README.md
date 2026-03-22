# Sistema de Mapeamento de Árvores Frutíferas - IFES Campus Cachoeiro

Este projeto é uma aplicação web interativa desenvolvida para mapear e localizar árvores frutíferas dentro do campus do IFES de Cachoeiro de Itapemirim. Ele utiliza a biblioteca **Leaflet** para renderização de mapas e **Leaflet Routing Machine** para traçar rotas da localização do usuário até as árvores desejadas.

## Funcionalidades

*   **Mapa Interativo**: Visualização de todo o campus com marcadores personalizados para cada tipo de fruta (ícones e cores distintos).
*   **Listagem Lateral**: Uma lista pesquisável de todas as árvores cadastradas, com seus nomes populares e científicos.
*   **Visual Moderno**: Design limpo e profissional com tipografia aprimorada e ícones visuais.
*   **Detalhes da Árvore**: Ao selecionar uma árvore (na lista ou no mapa), um cartão flutuante exibe informações detalhadas como espécie, nome popular e descrição do local.
*   **Roteamento Inteligente**: Funcionalidade para traçar a melhor rota a pé da sua localização atual até a árvore selecionada, com estimativa de tempo e distância.
*   **Responsividade**: Interface adaptada tanto para computadores quanto para dispositivos móveis.

## Tecnologias Utilizadas

*   HTML5 / CSS3
*   JavaScript (ES6+)
*   [Leaflet.js](https://leafletjs.com/) (Mapas)
*   [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/) (Rotas)
*   [OpenStreetMap](https://www.openstreetmap.org/) (Dados do Mapa)
*   Font Awesome (Ícones)

## Estrutura de Arquivos

```
arvores_frutiferas_IFES/
├── arvores_frutiferas_IFES.csv  # Base de dados das árvores
├── index.html                   # Estrutura da página (página inicial)
├── style.css                    # Estilos visuais
├── script.js                    # Lógica da aplicação
└── README.md                    # Documentação
```

## Como Hospedar no GitHub Pages

Este projeto está pronto para ser hospedado gratuitamente no GitHub Pages. Siga os passos:

1.  **Crie um repositório no GitHub** e faça o upload de todos os arquivos deste projeto.
2.  No repositório do GitHub, vá em **Settings** (Configurações) > **Pages** (no menu lateral esquerdo).
3.  Em **Source**, selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
4.  Clique em **Save**.
5.  Aguarde alguns instantes e atualize a página. O GitHub fornecerá o link para acessar seu mapa online (ex: `https://seu-usuario.github.io/nome-do-repositorio/`).

**Nota Importante:** Ao hospedar no GitHub Pages (que usa HTTPS), a geolocalização funcionará perfeitamente em dispositivos móveis e desktop.

## Como Utilizar Localmente

### Pré-requisitos

Para que o sistema funcione corretamente, especialmente o carregamento do arquivo CSV e o acesso à geolocalização, você precisa rodar a aplicação através de um servidor web local. Abrir o arquivo `index.html` diretamente (via `file://`) pode causar erros de CORS (Cross-Origin Resource Sharing).

### Passo a Passo

1.  **Instale uma extensão de servidor local** no seu VS Code (como "Live Server") ou utilize Python/Node.js.
    *   **Opção com Python**:
        Abra o terminal na pasta raiz do projeto e execute:
        ```bash
        python3 -m http.server
        ```
        Acesse `http://localhost:8000/src/` no seu navegador.
    
    *   **Opção com Node.js (http-server)**:
        ```bash
        npx http-server .
        ```
    
2.  **Permita a Geolocalização**:
    Ao abrir o site, o navegador solicitará permissão para acessar sua localização. Clique em "Permitir" para habilitar a funcionalidade de rotas.

3.  **Navegando**:
    *   Use a **Barra Lateral** para buscar uma fruta específica (ex: "Manga").
    *   Clique em um item da lista ou em um marcador no mapa.
    *   No cartão que aparecer, clique em **Traçar Rota** para ver o caminho.

## Dados

As coordenadas e informações das árvores são carregadas dinamicamente do arquivo `arvores_frutiferas_IFES.csv`, facilitando a atualização do sistema sem necessidade de alterar o código-fonte.
