import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, Camera, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Upload, Trash2, Plus, Sparkles, XCircle } from 'lucide-react';

const STICKER_LIST = [
  { id: 1, text: "chào buổi sáng!", expression: "vui vẻ, cười mỉm nhẹ nhàng" },
  { id: 2, text: "cái giề?", expression: "nhìn nghiêng, vẻ mặt thắc mắc, nhướng mày" },
  { id: 3, text: "tôi nhắc em!", expression: "vẻ mặt nghiêm túc, mắt nhìn thẳng, cau mày nhẹ" },
  { id: 4, text: "buồn ngủ quá~", expression: "đang ngáp to hoặc lim dim ngủ" },
  { id: 5, text: "huhu ㅠㅠ", expression: "vẻ mặt mếu máo sắp khóc, rưng rưng" },
  { id: 6, text: "wow!", expression: "mắt mở to tròn ngạc nhiên, miệng chữ O" },
  { id: 7, text: "duyệt!", expression: "vẻ mặt hài lòng, cười tươi rạng rỡ" },
  { id: 8, text: "ê nha!", expression: "nháy một mắt hoặc vẻ mặt lém lỉnh" },
  { id: 9, text: "át chì!", expression: "vẻ mặt nhăn mũi, nhắm tịt mắt sắp hắt xì" },
  { id: 10, text: "mlem mlem~", expression: "vẻ mặt thèm ăn, thè lưỡi liếm môi" },
  { id: 11, text: "giận !", expression: "phồng hai má to, môi hơi trễ xuống dỗi hờn" },
  { id: 12, text: "ủa???", expression: "vẻ mặt ngơ ngác, đầu hơi nghiêng sang một bên" },
  { id: 13, text: "gút nai:3", expression: "đang ngủ say sưa, khuôn mặt thanh thản" },
  { id: 14, text: "xin lũi nhoa", expression: "vẻ mặt hối lỗi, mắt tròn xoe cụp xuống đáng thương" },
  { id: 15, text: "iu quoá", expression: "vẻ mặt tràn đầy tình cảm, cười hiền lành" },
  { id: 16, text: "ngầu chưa nè !", expression: "vẻ mặt tự tin, cool ngầu" },
  { id: 17, text: "hông chịu đâuu", expression: "vẻ mặt hờn dỗi, miệng mếu chực khóc" },
  { id: 18, text: "số 1!", expression: "vẻ mặt hào hứng, phấn khích tột độ" },
  { id: 19, text: "hmmm...", expression: "vẻ mặt đang đăm chiêu suy nghĩ, cau mày" },
  { id: 20, text: "pái pai!", expression: "vẻ mặt vui vẻ cười tươi tắn" },
  { id: 21, text: "Trời ơi!", expression: "sốc, hai mắt nhắm nghiền, miệng há hốc" },
  { id: 22, text: "Moah~", expression: "chu mỏ đáng yêu như đang hôn" },
  { id: 23, text: "Thích quá!", expression: "mắt sáng rực, cười tít cả mắt" },
  { id: 24, text: "Xấu hổ quá", expression: "cười bẽn lẽn, cúi nhẹ đầu" },
  { id: 25, text: "Sợ quá đi!", expression: "co rúm người, mắt mở to sợ hãi" },
  { id: 26, text: "Đói bụng qá", expression: "mếu máo khóc lóc đòi ăn" },
  { id: 27, text: "Lêu lêu", expression: "thè lưỡi dài trêu chọc, mắt tinh nghịch" },
  { id: 28, text: "Đỉnh chóp", expression: "cười mỉm tự hào, vẻ mặt đắc ý" },
  { id: 29, text: "Buồn bã", expression: "mặt xị xuống, ánh mắt buồn thiu" },
  { id: 30, text: "Cạn lời", expression: "mắt nhìn sang một bên, vẻ mặt bất lực" }
];

const App = () => {
  const [stickers, setStickers] = useState(STICKER_LIST.map(s => ({ ...s, url: null, status: 'idle' })));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const [sourceImages, setSourceImages] = useState([]); 
  const fileInputRef = useRef(null);
  
  // Tối ưu 1: Ref kiểm soát việc hủy tiến trình (Abort Controller)
  const isCancelledRef = useRef(false);

  const apiKey = ""; 

  // Tối ưu hóa bộ nhớ: Giảm size xuống 500px, đủ nét cho sticker, siêu nhẹ cho API
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; 
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type, 0.8)); 
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Nếu đang tạo thì không cho upload thêm để tránh xung đột state
    if (isGenerating) return; 

    setError(null);
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) { 
        setError("Có ảnh vượt quá 15MB, vui lòng chọn ảnh nhẹ hơn.");
        continue;
      }
      try {
        const compressedDataUrl = await compressImage(file);
        const base64 = compressedDataUrl.split(',')[1];
        const newImage = {
          id: Math.random().toString(36).substr(2, 9),
          base64: base64,
          preview: compressedDataUrl,
          mimeType: file.type
        };
        setSourceImages(prev => [...prev, newImage]);
      } catch (err) {
        console.error("Lỗi nén ảnh", err);
      }
    }
    // Reset trạng thái sticker về ban đầu khi có ảnh mới
    setStickers(STICKER_LIST.map(s => ({ ...s, url: null, status: 'idle' })));
  };

  const removeImage = (id) => {
    if (isGenerating) return;
    setSourceImages(prev => prev.filter(img => img.id !== id));
    setStickers(STICKER_LIST.map(s => ({ ...s, url: null, status: 'idle' })));
  };

  const generateSticker = async (sticker, index) => {
    if (isCancelledRef.current) return; // Chặn thực thi nếu bị hủy

    setStickers(prev => {
      const newStickers = [...prev];
      newStickers[index].status = 'generating';
      return newStickers;
    });

    const prompt = `Bạn là một AI xử lý ảnh (Photo Editor). 
    NHIỆM VỤ: Chỉnh sửa khuôn mặt em bé TỪ ĐÚNG CÁC ẢNH GỐC BÊN DƯỚI. ĐÂY LÀ YÊU CẦU BẮT BUỘC.
    NGUYÊN TẮC KHÔNG THỎA HIỆP:
    1. COPY-PASTE KHUÔN MẶT: Bắt buộc dùng đúng 100% hình dáng mắt, mũi, miệng, má phúng phính và kiểu tóc của em bé trong ảnh. 
    2. KHÔNG AI-GENERATED: Không được tạo ra một em bé ảo khác. Không được dùng filter hoạt hình hay làm mịn da quá đà.
    3. HÀNH ĐỘNG: Chỉ sử dụng kỹ thuật "morphing" để biến đổi các cơ mặt (mở miệng, nhắm mắt, nhăn trán) thành biểu cảm: "${sticker.expression}".
    4. VĂN BẢN: Thêm dòng chữ tiếng Việt "${sticker.text}" ở dưới cùng, font chữ to, viền trắng nổi bật.
    5. ĐỊNH DẠNG: Ảnh thật tách nền, có viền trắng dày bọc quanh toàn bộ (chuẩn sticker Zalo).`;

    const fetchWithRetry = async (retries = 0) => {
      if (isCancelledRef.current) return; // Chặn trước khi gửi request mới

      try {
        const imageParts = sourceImages.map(img => ({
          inlineData: { mimeType: img.mimeType, data: img.base64 }
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...imageParts] }],
            generationConfig: { responseModalities: ["IMAGE"] }
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        
        if (!base64Data) throw new Error("AI không xuất được ảnh.");

        // Nếu bị hủy trong lúc chờ API phản hồi, vứt bỏ kết quả
        if (isCancelledRef.current) return; 

        const imageUrl = `data:image/png;base64,${base64Data}`;
        
        setStickers(prev => {
          const newStickers = [...prev];
          newStickers[index].url = imageUrl;
          newStickers[index].status = 'done';
          return newStickers;
        });
      } catch (err) {
        if (isCancelledRef.current) return;
        
        if (retries < 2) { // Giảm retry để luồng không bị tắc nghẽn quá lâu
          const delayTime = Math.pow(2, retries) * 1000;
          await new Promise(res => setTimeout(res, delayTime));
          await fetchWithRetry(retries + 1);
        } else {
          setStickers(prev => {
            const newStickers = [...prev];
            newStickers[index].status = 'error';
            return newStickers;
          });
        }
      }
    };

    await fetchWithRetry();
  };

  // Tối ưu 2: Hàng đợi luồng xử lý (Concurrency Promise Pool)
  const generateAll = async () => {
    if (sourceImages.length === 0) {
      setError("Vui lòng tải ảnh nguồn lên trước.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    isCancelledRef.current = false;
    
    const pendingStickers = stickers.map((s, i) => ({ ...s, originalIndex: i })).filter(s => s.status !== 'done');
    let completedCount = stickers.length - pendingStickers.length;

    // Giới hạn xử lý song song tối đa 3 tác vụ cùng lúc để đảm bảo mạng mượt mà
    const CONCURRENCY_LIMIT = 3; 
    let currentIndex = 0;

    // Worker function tự động lấy task tiếp theo khi xong task hiện tại
    const worker = async () => {
      while (currentIndex < pendingStickers.length) {
        if (isCancelledRef.current) break; // Thoát luồng nếu người dùng ấn Hủy
        
        const taskIndex = currentIndex;
        currentIndex++; // Chuyển sang task tiếp theo cho worker khác
        
        const task = pendingStickers[taskIndex];
        await generateSticker(task, task.originalIndex);
        
        if (!isCancelledRef.current) {
          completedCount++;
          setProgress(Math.round((completedCount / stickers.length) * 100));
        }
      }
    };

    // Khởi tạo các workers chạy song song
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, pendingStickers.length); i++) {
      workers.push(worker());
    }

    // Chờ tất cả các luồng hoàn thành
    await Promise.all(workers);
    
    // Nếu không bị hủy thì set trạng thái hoàn thành
    if (!isCancelledRef.current) {
      setIsGenerating(false);
    }
  };

  // Tối ưu 3: Hàm Hủy tiến trình
  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsGenerating(false);
    // Chuyển các sticker đang 'generating' về lại 'idle'
    setStickers(prev => prev.map(s => s.status === 'generating' ? { ...s, status: 'idle' } : s));
  };

  const downloadImage = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `sticker_be_${name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cleanup hàm khi component unmount
  useEffect(() => {
    return () => { isCancelledRef.current = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
          <div className="flex items-start md:items-center gap-5">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-200 shrink-0">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">
                Zalo Sticker Studio <span className="text-blue-600">PRO</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Tốc độ cao • Xử lý đa luồng (Concurrency)
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={isGenerating}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isGenerating}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 rounded-2xl font-bold transition-all ${isGenerating ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'}`}
            >
              <Plus className="w-5 h-5" />
              Thêm ảnh bé
            </button>
            
            {isGenerating ? (
              <button
                onClick={handleCancel}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200"
              >
                <XCircle className="w-5 h-5" />
                Dừng tạo ({progress}%)
              </button>
            ) : (
              <button
                onClick={generateAll}
                disabled={sourceImages.length === 0}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  sourceImages.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                Bắt đầu Tạo Sticker
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-10 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Dữ liệu khuôn mặt ({sourceImages.length} ảnh)
            </h3>
            {isGenerating && (
              <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang xử lý đa luồng...
              </span>
            )}
          </div>
          
          <div className="p-4 md:p-6 flex flex-wrap gap-4">
            {sourceImages.map((img) => (
              <div key={img.id} className="relative group">
                <img 
                  src={img.preview} 
                  className={`w-24 h-24 rounded-2xl object-cover border-2 transition-all shadow-sm ${isGenerating ? 'border-slate-200 opacity-80' : 'border-slate-100 group-hover:border-indigo-400'}`} 
                  alt="Nguồn" 
                />
                {!isGenerating && (
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 scale-90 group-hover:scale-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isGenerating}
              className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all bg-slate-50 ${isGenerating ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50'}`}
            >
              <Plus className="w-7 h-7 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tải lên</span>
            </button>
          </div>
        </div>

        {isGenerating && (
          <div className="mb-8 p-6 bg-white rounded-3xl shadow-sm border border-slate-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700">Tốc độ xử lý: ~3 ảnh/lần...</span>
              <span className="text-sm font-bold text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {stickers.map((sticker, index) => (
            <div 
              key={sticker.id} 
              className={`bg-white rounded-3xl p-3 shadow-sm border border-slate-200/60 flex flex-col items-center group transition-all duration-300 ${sourceImages.length > 0 && !isGenerating ? 'hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-200' : ''}`}
            >
              <div className="relative w-full aspect-square rounded-[1.25rem] bg-slate-50 flex items-center justify-center overflow-hidden mb-4 border border-slate-100">
                {sticker.status === 'done' ? (
                  <>
                    <img 
                      src={sticker.url} 
                      alt={sticker.text} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <button 
                        onClick={() => downloadImage(sticker.url, sticker.text)}
                        className="p-3 bg-white shadow-2xl rounded-full text-indigo-600 hover:scale-110 hover:bg-indigo-50 transition-all"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : sticker.status === 'generating' ? (
                  <div className="flex flex-col items-center gap-3 text-center p-2">
                    <div className="relative flex items-center justify-center">
                       <Loader2 className="w-8 h-8 text-indigo-500 animate-spin absolute" />
                       <div className="w-4 h-4 bg-indigo-100 rounded-full"></div>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 tracking-widest uppercase">Đang đồng bộ...</span>
                  </div>
                ) : sticker.status === 'error' ? (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-rose-300" />
                    <button 
                      onClick={() => generateSticker(sticker, index)} 
                      disabled={isGenerating}
                      className="text-[11px] px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <ImageIcon className="w-10 h-10" />
                    {sourceImages.length === 0 && <span className="text-[10px] font-medium">Chờ dữ liệu</span>}
                  </div>
                )}
              </div>
              <div className="text-center w-full px-1">
                <span className="block text-[13px] md:text-sm font-bold text-slate-700 truncate mb-1.5">
                  {sticker.text}
                </span>
                <div className="h-1 w-8 bg-indigo-100 rounded-full mx-auto group-hover:w-12 group-hover:bg-indigo-400 transition-all"></div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-16 text-center text-slate-400 text-sm pb-10">
          <p>© 2024 • Zalo Sticker Studio Pro • Tối ưu hóa đa luồng</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
