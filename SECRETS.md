# Secrets & Environment Variables (Security Guide)

Important: Do NOT commit secrets (API keys, DB connection strings, private tokens) into the repository. The repo now ignores `.env` files — store secrets locally or in a secret manager.

Recommended variable name
- `MONGODB_URI` — your MongoDB connection string (example: `mongodb+srv://<user>:<password>@cluster.example.mongodb.net/<db>?retryWrites=true&w=majority`).

Local (PowerShell) — temporary for current session
- Run in PowerShell to set for the current session (replace the placeholder with your secret):

```powershell
$env:MONGODB_URI = 'mongodb+srv://<user>:<password>@your-cluster.mongodb.net/your-db'
```

Local (PowerShell) — persistent (create a local `.env` file)
- Create a file named `.env` in the repo root (this file is gitignored). Put the secret inside:

```
MONGODB_URI=mongodb+srv://<user>:<password>@your-cluster.mongodb.net/your-db
```

Then start your app normally (the app should load `process.env.MONGODB_URI`).

GitHub Actions / GitHub Secrets
- Store the secret in the repository settings: `Settings -> Secrets and variables -> Actions -> New repository secret`.
- Or use the GitHub CLI locally:

```bash
gh secret set MONGODB_URI --body "mongodb+srv://<user>:<password>@your-cluster.mongodb.net/your-db"
```

In your GitHub Actions workflow, reference the secret as:

```yaml
env:
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

Other secret stores
- Consider using a dedicated secret manager for production: Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, or GitHub Secrets for CI.

Node.js usage example

```js
// server.js
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');
// use uri with your MongoDB client (mongoose/MongoClient)
```

Why I didn't store your value
- I did NOT save the connection string you pasted into the repository because committing credentials exposes them publicly and is a security risk. If you want me to help add it to a GitHub repository secret, I can provide the exact CLI/Actions change you should run — but I cannot push the secret from here.

If you want, I can:
- Show the exact command to run locally to save it to `.env` (PowerShell-safe). 
- Provide a GitHub Actions workflow snippet that uses the secret.
- Walk you through using Azure/AWS secret managers.
