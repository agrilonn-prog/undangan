// Contoh lengkap per template. Dipakai otomatis saat undangan.html dibuka tanpa parameter "pria" (mode demo).
const _C=[
['klasik','Raka','Sinta','Bpk. Hadi & Ibu Sari','Bpk. Wijaya & Ibu Lestari','Gedung Serbaguna Pemuda','Jl. Pemuda No. 1, Semarang','WIB','Keluarga Besar Pak Budi','12'],
['rustic','Arga','Laras','Bpk. Santoso & Ibu Dewi','Bpk. Haryanto & Ibu Tri','Kebun Raya Kopeng','Jl. Raya Kopeng, Semarang','WIB','Kak Rina & Partner','7'],
['modern','Dimas','Nadia','Bpk. Aditya & Ibu Maya','Bpk. Pratama & Ibu Sinta','Rooftop Hall Jakarta','Jl. Sudirman No. 88, Jakarta','WIB','Tim Kantor Pak Andi','3'],
['islami','Ahmad Fauzan','Aisyah Zahra','Bpk. H. Abdullah & Ibu Hj. Fatimah','Bpk. H. Yusuf & Ibu Hj. Khadijah','Masjid Agung Jawa Tengah','Jl. Gajah Raya, Semarang','WIB','Ustadz Hasan & Keluarga','5'],
['minang','Rizky','Rahmi','Bpk. Zulkifli & Ibu Nurhayati','Bpk. Irwan & Ibu Yenti','Balairung Sari','Jl. Sudirman No. 12, Padang','WIB','Datuak Rajo & Keluarga','1'],
['jawa','Bagas','Ayu','Bpk. Slamet & Ibu Wahyuni','Bpk. Prasetyo & Ibu Rini','Pendopo Agung','Jl. Kauman No. 7, Surakarta','WIB','Eyang Kakung & Putri','2'],
['sunda','Asep','Rina','Bpk. Dadang & Ibu Euis','Bpk. Cecep & Ibu Iis','Gedung Sasana Budaya','Jl. Braga No. 20, Bandung','WIB','Kang Dede & Teh Imas','9'],
['batak','Tigor','Marlina','Bpk. Simanjuntak & Ibu Br. Siregar','Bpk. Nainggolan & Ibu Br. Tobing','Gedung Serbaguna HKBP','Jl. Sisingamangaraja, Medan','WIB','Tulang & Nantulang','4'],
['bali','Kadek','Ayu','Bpk. I Wayan Suarta & Ibu Ni Made Ratni','Bpk. I Ketut Darma & Ibu Ni Luh Sari','Puri Agung Ubud','Jl. Raya Ubud, Gianyar','WITA','Bli Gede & Mbok Ayu','6'],
['kristen','Daniel','Grace','Bpk. Samuel & Ibu Ruth','Bpk. Yosua & Ibu Maria','Gereja Kristen Immanuel','Jl. Pahlawan No. 5, Semarang','WIB','Pdt. Yohanes & Keluarga','8'],
['katolik','Yohanes','Maria','Bpk. Thomas & Ibu Agnes','Bpk. Petrus & Ibu Clara','Gereja Katedral Santa Maria','Jl. Gereja No. 3, Surabaya','WIB','Romo Antonius','10'],
['hindu','Putu','Komang','Bpk. I Made Sudana & Ibu Ni Wayan Sri','Bpk. I Nyoman Arta & Ibu Ni Ketut Ari','Wantilan Pura Desa','Jl. Hayam Wuruk, Denpasar','WITA','Jro Mangku & Keluarga','11'],
['buddha','Jonathan','Metta','Bpk. Tan & Ibu Lim','Bpk. Wijaya & Ibu Sari','Vihara Dharma Bhakti','Jl. Kemuning No. 9, Semarang','WIB','Bhante & Umat Vihara','13'],
['tionghoa','Kevin','Michelle','Bpk. Lim & Ibu Tan','Bpk. Gunawan & Ibu Huang','Ballroom Grand Imperial','Jl. Pecinan No. 18, Semarang','WIB','Koko Andy & Cici Lina','14'],
['pixel','Nico','Gita','Bpk. Budi & Ibu Ani','Bpk. Rudi & Ibu Tuti','Gamers Hall Arena','Jl. Teknologi No. 8, Bandung','WIB','Squad Guild Pak Eko','15'],
['sinematik','Adrian','Clara','Bpk. Hendra & Ibu Vina','Bpk. Surya & Ibu Dian','Grand Cinema Ballroom','Jl. Gatot Subroto, Jakarta','WIB','Tamu Kehormatan','VIP'],
['salju','Elvan','Salsa','Bpk. Rahman & Ibu Nita','Bpk. Fajar & Ibu Winda','Edelweiss Hall','Jl. Raya Lembang, Bandung','WIB','Kak Yuki & Keluarga','16'],
['vintage','Hendra','Lestari','Bpk. Gunawan & Ibu Sri','Bpk. Mulyono & Ibu Tati','Gedung Lawang Sewu','Jl. Pemuda, Semarang','WIB','Opa & Oma','17']];
const CONTOH=Object.fromEntries(_C.map(([id,p,w,op,ow,tp,al,z,to,m])=>[id,{t:id,pria:p,wanita:w,ortupria:op,ortuwanita:ow,tempat:tp,alamat:al,zona:z,to,meja:m,tanggal:'2026-12-20T09:00',resepsi:'2026-12-20T11:00',maps:'https://maps.google.com/?q='+encodeURIComponent(tp+' '+al),wa:'6281234567890',bank:'BCA',norek:'1234567890',an:p+' Pratama',live:'https://youtube.com',catatan:'Mohon hadir 15 menit lebih awal dan mengenakan busana sesuai tema.',cerita:`2019|Bertemu|${p} dan ${w} bertemu di sebuah acara kampus;2023|Lamaran|Dua keluarga bertemu dan restu pun diberikan;2026|Menikah|Kami memulai perjalanan baru bersama`,foto:`assets/foto/${id}-0.jpg`,galeri:[1,2,3,4].map(i=>`assets/foto/${id}-${i}.jpg`).join(', '),musik:`assets/musik/${id}.mp3`}]));
