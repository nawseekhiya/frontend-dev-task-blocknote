import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BlockNote Portfolio Starter
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A clean foundation for building custom BlockNote portfolio editors
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/blocknote-portfolio"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Editor
            </Link>
            <a
              href="https://github.com/your-org/blocknote-portfolio-starter"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              🚀 What&apos;s Included
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Basic BlockNote editor with default blocks</li>
              <li>• Next.js 15 with App Router</li>
              <li>• TypeScript configuration</li>
              <li>• Tailwind CSS styling</li>
              <li>• Responsive design</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              🎯 Your Task
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Create custom Project Card block</li>
              <li>• Implement modal editor</li>
              <li>• Add PDF export functionality</li>
              <li>• Build server components</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📚 Getting Started
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Install dependencies</h3>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                pnpm install
              </code>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Start development server</h3>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                pnpm dev
              </code>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Visit the editor</h3>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                http://localhost:3000/blocknote-portfolio
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
