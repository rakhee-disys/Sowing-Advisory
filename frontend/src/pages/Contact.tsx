// src/pages/Contact.tsx
export const Contact = () => {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
          <div className="prose prose-lg">
            <p className="text-lg text-gray-600 mb-6">
              Get in touch with us for any questions or support regarding Dexian.India's services.
            </p>

            {/* External Link for Direct Contact */}
            <p className="text-lg text-gray-600 mt-4">
              For more information, visit our official contact page:{' '}
              <a
                href="https://dexian.com/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline"
              >
                Dexian Contact Page
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
