# Swagger 3 to Json schema

A ferramenta é responsável por converter corpos de requisição/resposta em JSON para códigos de validação JSON schema validation.

# Dependências

 1. Ter o gerenciador de pacotes npm instalado.

# Instalação

Na raíz do projeto, execute o seguinte comando:

    npm install

# Configuração do projeto
As configurações do projeto são feitas por meio de 2 arquivos: .env e /config/Routes.js.

O arquivo .env é responsável por armazenar as variáveis de ambiente da aplicação, sendo elas:

|Variável         |Descrição                                                         |
|-----------------|------------------------------------------------------------------|
|BASE_URL         |URL da raiz da aplicação. Utilizada para criar o HATEOAS.         |
|SERVER_PORT      |Porta em que a aplicação deve ser executada.                      |
|TEMP_FILE_STORAGE|Caminho para pasta onde os arquivos swagger devem ser persistidos.|

O arquivo /config/Routes.js é o responsável por configurar as rotas da API, mapeando cada requisição para determinado método de determinado controlador.

## Execução do projeto no ambiente de desenvolvimento

Para executar o projeto com live reload, em sua máquina local, execute o seguinte comando na raíz do projeto:

    npm run dev

## Documentação da API
A documentação da API foi feita conforme Open API 3.0. Para visualizar a documentação, acesse o [editor de swagger](https://editor.swagger.io) , clique em file > import file, e envie o arquivo presente na pasta /docs/swagger.json.

## Front-end da aplicação
A aplicação faz parte de um conjunto de ferramentas de APIs, e compartilha o front-end com outras ferramentas. Para obter a aplicação react responsável pela interface gráfica da aplicação, acesse o [repositório do github](https://github.com/AlvesThales/sensediatools).