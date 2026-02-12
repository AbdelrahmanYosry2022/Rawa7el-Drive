// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import * as tus from 'tus-js-client';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, FileText, File, Presentation, Search, Grid, List, Tag, Calendar, Download, Eye, ArrowRight, Loader2, BookOpen, Upload, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Material { id: string; title: string; description: string | null; type: string; fileName: string; fileSize: number; mimeType: string; storagePath: string; publicUrl: string | null; category: string | null; uploadedBy: string; createdAt: string; lectureTitle?: string; }

const FILE_TYPE_ICONS: Record<string, any> = { PDF: FileText, DOCUMENT: FileText, POWERPOINT: Presentation, OTHER: File };
const FILE_TYPE_COLORS: Record<string, string> = { PDF: 'bg-red-100 text-red-600', DOCUMENT: 'bg-blue-100 text-blue-600', POWERPOINT: 'bg-orange-100 text-orange-600', OTHER: 'bg-slate-100 text-slate-600' };
const CATEGORIES = [
  { id: 'all', name: '\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0648\u0627\u062F', color: '#6366F1' },
  { id: 'quran', name: '\u0639\u0644\u0648\u0645 \u0627\u0644\u0642\u0631\u0622\u0646', color: '#10B981' },
  { id: 'tajweed', name: '\u0627\u0644\u062A\u062C\u0648\u064A\u062F', color: '#F59E0B' },
  { id: 'fiqh', name: '\u0627\u0644\u0641\u0642\u0647', color: '#8B5CF6' },
  { id: 'hadith', name: '\u0627\u0644\u062D\u062F\u064A\u062B', color: '#EC4899' },
  { id: 'seerah', name: '\u0627\u0644\u0633\u064A\u0631\u0629', color: '#0EA5E9' },
  { id: 'aqeedah', name: '\u0627\u0644\u0639\u0642\u064A\u062F\u0629', color: '#EF4444' },
  { id: 'arabic', name: '\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629', color: '#14B8A6' },
  { id: 'other', name: '\u0623\u062E\u0631\u0649', color: '#64748B' },
];
const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx';
const ACCEPTED_MIME = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'];

function getFileType(mime: string, name: string): string {
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF';
  if (mime.includes('powerpoint') || mime.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) return 'POWERPOINT';
  if (mime.includes('word') || mime.includes('document') || name.endsWith('.docx') || name.endsWith('.doc')) return 'DOCUMENT';
  return 'OTHER';
}
function formatFileSize(b: number): string { if (!b) return '0 B'; const k=1024; const s=['B','KB','MB','GB']; const i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(2))+' '+s[i]; }
function formatDate(d: string): string { return new Date(d).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}); }

export default function LibraryPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<{type:'success'|'error';msg:string}|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [upFile, setUpFile] = useState<File|null>(null);
  const [upTitle, setUpTitle] = useState('');
  const [upDesc, setUpDesc] = useState('');
  const [upCat, setUpCat] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [upProg, setUpProg] = useState(0);
  const tusUploadRef = useRef<tus.Upload|null>(null);

  useEffect(() => { fetchMaterials(); }, []);
  const notify = (type:'success'|'error', msg:string) => { setNotif({type,msg}); setTimeout(()=>setNotif(null),4000); };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('Material').select('*, CalendarEventMaterial ( CalendarEvent ( title ) )').order('createdAt', { ascending: false });
      if (error) throw error;
      setMaterials((data||[]).map((m:any)=>({...m, lectureTitle: m.CalendarEventMaterial?.[0]?.CalendarEvent?.title||null})));
    } catch (e) { console.error('Error fetching materials:', e); } finally { setLoading(false); }
  };

  const updateCategory = async (id: string, cat: string) => {
    try { const {error}=await supabase.from('Material').update({category:cat}).eq('id',id); if(error) throw error; setMaterials(p=>p.map(m=>m.id===id?{...m,category:cat}:m)); } catch(e){ console.error(e); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f) return;
    if(!ACCEPTED_MIME.includes(f.type)&&!f.name.match(/\.(pdf|docx?|pptx?)$/i)){ notify('error','\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645. \u0627\u0644\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629: PDF, Word, PowerPoint'); return; }
    setUpFile(f); if(!upTitle) setUpTitle(f.name.replace(/\.[^/.]+$/,''));
  };
  const resetForm = () => { setUpFile(null); setUpTitle(''); setUpDesc(''); setUpCat('other'); setUpProg(0); };

  const cancelUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort(true);
      tusUploadRef.current = null;
    }
    setUploading(false); setUpProg(0);
    setShowModal(false);
    resetForm();
  };

  const closeModal = cancelUpload;

  const uploadWithTus = (file: File, storagePath: string, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const projectId = supabaseUrl.replace('https://','').split('.')[0];
      const upload = new tus.Upload(file, {
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${token}`,
          'x-upsert': 'false',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'bedaya-materials',
          objectName: storagePath,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: function (error) {
          tusUploadRef.current = null;
          reject(error);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          const pct = Math.round((bytesUploaded / bytesTotal) * 90);
          setUpProg(5 + pct);
        },
        onSuccess: function () {
          tusUploadRef.current = null;
          resolve();
        },
      });
      tusUploadRef.current = upload;
      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
        upload.start();
      });
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault(); if(!upFile||!upTitle.trim()) return;
    setUploading(true); setUpProg(2);
    try {
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.user){ notify('error','\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B'); setUploading(false); return; }
      const user = session.user;
      setUpProg(5);
      const ts=Date.now(), safe=upFile.name.replace(/[^a-zA-Z0-9._-]/g,'_');
      const path=`materials/${user.id}/${ts}_${safe}`;
      await uploadWithTus(upFile, path, session.access_token);
      setUpProg(95);
      const {data:ud}=supabase.storage.from('bedaya-materials').getPublicUrl(path);
      const url=ud?.publicUrl||null;
      setUpProg(97);
      const ft=getFileType(upFile.type,upFile.name);
      const {error:ie}=await supabase.from('Material').insert({title:upTitle.trim(),description:upDesc.trim()||null,type:ft,fileName:upFile.name,fileSize:upFile.size,mimeType:upFile.type,storagePath:path,publicUrl:url,category:upCat,uploadedBy:user.id});
      if(ie) throw ie; setUpProg(100);
      notify('success','\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0645\u0627\u062F\u0629 \u0628\u0646\u062C\u0627\u062D');
      setShowModal(false); resetForm(); fetchMaterials();
    } catch(err:any){ if(err?.message !== 'cancelled' && err?.toString?.() !== 'tus: upload has been aborted'){ console.error(err); notify('error',err?.message||'\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0631\u0641\u0639'); } } finally { tusUploadRef.current = null; setUploading(false); setUpProg(0); }
  };

  const handleDelete = async (m: Material) => {
    if(!confirm(`\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0630\u0641 "${m.title}"\u061F`)) return;
    try {
      if(m.storagePath) await supabase.storage.from('bedaya-materials').remove([m.storagePath]);
      const {error}=await supabase.from('Material').delete().eq('id',m.id);
      if(error) throw error; notify('success','\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641'); setMaterials(p=>p.filter(x=>x.id!==m.id));
    } catch(err:any){ console.error(err); notify('error',err?.message||'\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0630\u0641'); }
  };

  const filtered = materials.filter(m => {
    const mc = selectedCategory==='all'||m.category===selectedCategory;
    const ms = !searchQuery||m.title.toLowerCase().includes(searchQuery.toLowerCase())||m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return mc&&ms;
  });
  const counts: Record<string,number> = { all: materials.length };
  materials.forEach(m=>{ const c=m.category||'other'; counts[c]=(counts[c]||0)+1; });

  const renderCard = (mat: Material) => {
    const Icon=FILE_TYPE_ICONS[mat.type]||File, cc=FILE_TYPE_COLORS[mat.type]||FILE_TYPE_COLORS.OTHER;
    return (
      <Card key={mat.id} className="group hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl ${cc} flex items-center justify-center flex-shrink-0`}><Icon className="w-6 h-6" /></div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 truncate">{mat.title}</h4>
              <p className="text-xs text-slate-500">{formatFileSize(mat.fileSize)}</p>
            </div>
          </div>
          {mat.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{mat.description}</p>}
          {mat.lectureTitle && <div className="flex items-center gap-1 text-xs text-slate-500 mb-2"><Calendar className="w-3 h-3" /><span className="truncate">{mat.lectureTitle}</span></div>}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <select value={mat.category||'other'} onChange={e=>updateCategory(mat.id,e.target.value)} className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1">
              {CATEGORIES.filter(c=>c.id!=='all').map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <div className="flex gap-1">
              {mat.publicUrl && (<><a href={mat.publicUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100" title="\u0639\u0631\u0636"><Eye className="w-4 h-4 text-slate-500" /></a><a href={mat.publicUrl} download={mat.fileName} className="p-1.5 rounded hover:bg-slate-100" title="\u062A\u062D\u0645\u064A\u0644"><Download className="w-4 h-4 text-slate-500" /></a></>)}
              <button onClick={()=>handleDelete(mat)} className="p-1.5 rounded hover:bg-red-50" title="\u062D\u0630\u0641"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderListItem = (mat: Material) => {
    const Icon=FILE_TYPE_ICONS[mat.type]||File, cc=FILE_TYPE_COLORS[mat.type]||FILE_TYPE_COLORS.OTHER;
    return (
      <Card key={mat.id} className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${cc} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900">{mat.title}</h4>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{formatFileSize(mat.fileSize)}</span><span>{formatDate(mat.createdAt)}</span>
                {mat.lectureTitle && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{mat.lectureTitle}</span>}
              </div>
            </div>
            <select value={mat.category||'other'} onChange={e=>updateCategory(mat.id,e.target.value)} className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1">
              {CATEGORIES.filter(c=>c.id!=='all').map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <div className="flex gap-1">
              {mat.publicUrl && (<><a href={mat.publicUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:bg-slate-100"><Eye className="w-4 h-4 text-slate-500" /></a><a href={mat.publicUrl} download={mat.fileName} className="p-2 rounded hover:bg-slate-100"><Download className="w-4 h-4 text-slate-500" /></a></>)}
              <button onClick={()=>handleDelete(mat)} className="p-2 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50" dir="rtl">
      {notif && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[60] p-4 rounded-xl shadow-lg flex items-center gap-3 ${notif.type==='success'?'bg-emerald-50 border border-emerald-200 text-emerald-800':'bg-red-50 border border-red-200 text-red-800'}`}>
          {notif.type==='success'?<CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />:<AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="flex-1 text-sm font-bold">{notif.msg}</span>
          <button onClick={()=>setNotif(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={()=>navigate('/dashboard')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><ArrowRight className="w-5 h-5 text-slate-600" /></button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><FolderOpen className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-xl font-bold text-slate-900">{'\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0648\u0627\u062F'}</h1><p className="text-xs text-slate-500">{'\u062A\u0635\u0641\u062D \u0648\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629'}</p></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={()=>setShowModal(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-amber-200 font-bold gap-2"><Upload className="w-4 h-4" />{'\u0631\u0641\u0639 \u0645\u0627\u062F\u0629 \u062C\u062F\u064A\u062F\u0629'}</Button>
              <Button onClick={()=>navigate('/lectures')} variant="outline" className="rounded-xl font-bold gap-2"><BookOpen className="w-4 h-4" />{'\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0636\u0631\u0627\u062A'}</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <Card className="sticky top-24"><CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Tag className="w-4 h-4" />{'\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A'}</h3>
              <div className="space-y-1">
                {CATEGORIES.map(cat=>(
                  <button key={cat.id} onClick={()=>setSelectedCategory(cat.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory===cat.id?'bg-amber-100 text-amber-700':'hover:bg-slate-100 text-slate-600'}`}>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:cat.color}} /><span>{cat.name}</span></div>
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{counts[cat.id]||0}</span>
                  </button>
                ))}
              </div>
            </CardContent></Card>
          </aside>

          <main className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder={'\u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0645\u0648\u0627\u062F...'} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>
              <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                <button onClick={()=>setViewMode('grid')} className={`p-2 rounded ${viewMode==='grid'?'bg-amber-100 text-amber-600':'text-slate-400'}`}><Grid className="w-4 h-4" /></button>
                <button onClick={()=>setViewMode('list')} className={`p-2 rounded ${viewMode==='list'?'bg-amber-100 text-amber-600':'text-slate-400'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="md:hidden mb-4 overflow-x-auto"><div className="flex gap-2 pb-2">
              {CATEGORIES.map(cat=>(<button key={cat.id} onClick={()=>setSelectedCategory(cat.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${selectedCategory===cat.id?'bg-amber-500 text-white':'bg-white border border-slate-200 text-slate-600'}`}>{cat.name}</button>))}
            </div></div>

            {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>}

            {!loading && filtered.length===0 && (
              <div className="text-center py-20">
                <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{'\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0648\u0627\u062F'}</h3>
                <p className="text-slate-500 mb-4">{searchQuery?'\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0646\u062A\u0627\u0626\u062C':'\u0644\u0645 \u064A\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0623\u064A \u0645\u0648\u0627\u062F \u0628\u0639\u062F'}</p>
                <Button onClick={()=>setShowModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2"><Upload className="w-4 h-4" />{'\u0631\u0641\u0639 \u0645\u0627\u062F\u0629 \u062C\u062F\u064A\u062F\u0629'}</Button>
              </div>
            )}

            {!loading && filtered.length>0 && viewMode==='grid' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(renderCard)}</div>}
            {!loading && filtered.length>0 && viewMode==='list' && <div className="space-y-2">{filtered.map(renderListItem)}</div>}
          </main>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-slate-800">{'\u0631\u0641\u0639 \u0645\u0627\u062F\u0629 \u062C\u062F\u064A\u062F\u0629'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${upFile?'border-amber-300 bg-amber-50':'border-slate-200 hover:border-amber-300 hover:bg-slate-50'}`} onClick={()=>document.getElementById('lib-file-input')?.click()}>
                <input type="file" id="lib-file-input" className="hidden" onChange={handleFileSelect} accept={ACCEPTED_TYPES} />
                {upFile ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center"><CheckCircle className="w-8 h-8 text-amber-600" /></div>
                    <p className="font-bold text-slate-800">{upFile.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(upFile.size)}</p>
                    <button type="button" onClick={(e)=>{e.stopPropagation();setUpFile(null);}} className="text-xs text-red-500 hover:underline">{'\u0625\u0632\u0627\u0644\u0629'}</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center"><Upload className="w-8 h-8 text-slate-400" /></div>
                    <p className="font-bold text-slate-600">{'\u0627\u0636\u063A\u0637 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0644\u0641'}</p>
                    <p className="text-xs text-slate-400">PDF, Word, PowerPoint</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{'\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0627\u062F\u0629'} *</label>
                <input type="text" value={upTitle} onChange={e=>setUpTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{'\u0648\u0635\u0641 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)'}</label>
                <textarea value={upDesc} onChange={e=>setUpDesc(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{'\u0627\u0644\u062A\u0635\u0646\u064A\u0641'}</label>
                <select value={upCat} onChange={e=>setUpCat(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                  {CATEGORIES.filter(c=>c.id!=='all').map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              {uploading && upProg>0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">{'\u062C\u0627\u0631\u064A \u0627\u0644\u0631\u0641\u0639...'}</span><span className="font-bold text-amber-600">{upProg}%</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all" style={{width:`${upProg}%`}} /></div>
                </div>
              )}
              {uploading ? (
                <button type="button" onClick={cancelUpload} className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-lg shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
                  <X className="w-5 h-5" />
                  {'\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0631\u0641\u0639'}
                </button>
              ) : (
                <button type="submit" disabled={!upFile||!upTitle.trim()} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-black text-lg shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  {'\u0631\u0641\u0639 \u0627\u0644\u0645\u0627\u062F\u0629'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
