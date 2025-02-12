import { useState } from "react";
import { uploadFile,searchQuery } from "../apis";
import { toast } from "react-toastify";



const FileUploadSearch = () => {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [summaryOption, setSummaryOption] = useState("medium"); 

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Only PDF files are allowed.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    await uploadFile(formData)
      .then((response) => {
        if(response.data.total_chunks){
          toast.success("File uploaded successfully");
        }
        else{
          toast.error("Unable to upload the file. Check format")
        }
      })
  } 

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Enter a search query.");
      return;
    }
    try {
      const response = await searchQuery(query,summaryOption);
      // if (!response || response.error) {
      //   setSearchResult("No results found.");
      // } else {
      //   console.log("response: ",response)
      //   setSearchResult(response.data.matched_text);
      // }
      if (response.data.err_code!="") {
        setSearchResult("");
        toast.error(response.data.summary);
      } else {
        setSearchResult(response.data.matched_text);
        toast.success("Response found");
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult("No results found.");
    }
  };

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-xl shadow-lg space-y-4">
      {/* Upload Section */}
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="fileUpload"
        />
        <label
          htmlFor="fileUpload"
          className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Select PDF
        </label>
        {file && <span className="text-sm">{file.name}</span>}
        <button
          onClick={handleUpload}
          className ="cursor-pointer px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" >Upload
        </button>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query"
          className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300"
        />

        {/* Summary Options */}
        <div className="flex space-x-4">
          <h6>Summary Option</h6>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="summary"
              value="short"
              checked={summaryOption === "short"}
              onChange={(e) => setSummaryOption(e.target.value)}
              className="form-radio text-blue-500"
            />
            <span>Short</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="summary"
              value="medium"
              checked={summaryOption === "medium"}
              onChange={(e) => setSummaryOption(e.target.value)}
              className="form-radio text-blue-500"
            />
            <span>Medium</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="summary"
              value="detailed"
              checked={summaryOption === "detailed"}
              onChange={(e) => setSummaryOption(e.target.value)}
              className="form-radio text-blue-500"
            />
            <span>Detailed</span>
          </label>
        </div>

        <button
          onClick={handleSearch}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Search
        </button>
      </div>


      {/* Search Result */}
      {searchResult && (
        <textarea
          readOnly
          className="w-full h-150 p-2 border rounded-md bg-gray-100"
          value={searchResult}
        />
      )}
    </div>
  );
};

export default FileUploadSearch;
