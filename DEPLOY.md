# Deployment Instructions

Follow these steps to deploy this Lead Scoring API to Vercel.

## 1. Local Testing
You can run the API locally to verify everything works:
1. Ensure you have Node.js installed.
2. Open terminal in this folder and run `npm install`.
3. Set your Gemini API key in your environment variables:
   - Windows (Command Prompt): `set GEMINI_API_KEY=your_api_key_here`
   - Windows (PowerShell): `$env:GEMINI_API_KEY="your_api_key_here"`
   - Mac/Linux: `export GEMINI_API_KEY="your_api_key_here"`
4. Run the local server: `npm run dev`
5. Visit `http://localhost:3000/api-docs` to see the Swagger documentation.
6. You can import `postman_collection.json` to Postman to test the 3 endpoints.

## 2. Push to GitHub
1. Create a new public or private repository on your GitHub account.
2. Commit this `submission/` folder to that repository.

## 3. Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Connect your GitHub account and import the repository you just created.
4. If your code is inside a subfolder (like `test-1-build/submission`), make sure to set the **Root Directory** in Vercel to that folder.
5. In the **Environment Variables** section, add:
   - Key: `GEMINI_API_KEY`
   - Value: `(paste your Gemini API key here)`
6. Click **Deploy**.
7. Once deployed, Vercel will give you a public URL (e.g., `https://your-project.vercel.app`).

You can test your deployed app using Postman by changing the `baseUrl` variable from `http://localhost:3000` to your new Vercel URL.
