# Publicar o código no GitHub

1. Crie um repositório vazio chamado `fieldops` na sua conta GitHub. Deixe a criação de README e `.gitignore` desmarcada, pois estes arquivos já acompanham o projeto.
2. No terminal do VS Code, entre na pasta `fieldops-portfolio`.
3. Revise os arquivos que serão versionados e execute:

```powershell
git init -b main
git add .
git status
git commit -m "feat: implementa FieldOps com React e API Java"
```

4. Copie a URL HTTPS do repositório criado e substitua `SEU_USUARIO` no exemplo:

```powershell
git remote add origin https://github.com/SEU_USUARIO/fieldops.git
git push -u origin main
```

O GitHub pode solicitar autenticação pelo navegador. Se o Git pedir nome e e-mail de autor, configure seus próprios dados antes de repetir o commit.

O `.gitignore` mantém arquivos de ambiente, dependências e builds fora do repositório. Os arquivos `.env.example` são modelos públicos e devem acompanhar os fontes.

Na descrição do repositório, use o texto de [Apresentação técnica](PORTFOLIO.md). As capturas em `docs/assets/` também ficam disponíveis para ilustrar o projeto. Os jobs de frontend e backend serão iniciados pelo workflow ao enviar o código.
