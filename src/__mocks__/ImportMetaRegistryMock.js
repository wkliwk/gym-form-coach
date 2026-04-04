// Mock for expo/src/winter/ImportMetaRegistry
// Prevents "import outside scope" error in Jest
module.exports = {
  ImportMetaRegistry: { url: null },
};
