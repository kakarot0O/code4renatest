const Hapi = require('@hapi/hapi');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the 'data' directory exists
const dataDirectory = path.join(__dirname, 'data'); 
fs.mkdirSync(dataDirectory, { recursive: true });

const removeRepoDirectory = (repoName) => {
    const repoPath = path.join(dataDirectory, repoName);
    fs.rmSync(repoPath, { recursive: true, force: true });
};

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
});

server.route({
    method: 'POST',
    path: '/analyze',
    handler: async (request, h) => {
        const { githubUrl } = request.payload;

        try {
            const repoName = githubUrl.split('/').pop().replace('.git', '');
            const repoPath = path.join(dataDirectory, repoName); // Store in 'data' 
            console.log(repoPath)

            // Cloning the repo
            execSync(`git clone ${githubUrl} ${repoPath}`); 

            // Finding Source Code Files (Modify if needed)
            const sourceCodeFiles = fs.readdirSync(repoPath)
                .filter(file => file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.py')); // Add more extensions if needed

            // Running sloc on Each File
            const results = {};
            sourceCodeFiles.forEach(file => {
                const filePath = path.join(repoPath, file);
                const output = execSync(`sloc ${filePath}`).toString();
		console.log(output)
                results[file] = output;
            });            

            // Deleting the repo
            removeRepoDirectory(repoName); 

            return h.response({ results }).code(200); 
        } catch (error) {
            return h.response({ error: 'Analysis failed' }).code(500);
        }
    }
});

server.start();
console.log('Server running on %s', server.info.uri);
