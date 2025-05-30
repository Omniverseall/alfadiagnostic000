import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { adminService, Doctor } from "@/services/adminService";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const LoadingTextIndicator = ({ text }: { text: string }) => (
  <div className="text-center py-10 text-gray-500 col-span-full">{text}</div>
);

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const cachedDoctors = localStorage.getItem('cached_doctors');
        if (cachedDoctors) {
          setDoctors(JSON.parse(cachedDoctors));
        }
        const fetchedDoctors: Doctor[] = await adminService.getDoctors();
        setDoctors(fetchedDoctors);
        localStorage.setItem('cached_doctors', JSON.stringify(fetchedDoctors));
      } catch (error) {
        console.error("Ошибка загрузки врачей:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
    const unsubscribe = adminService.subscribeDoctors((updatedDoctors: Doctor[]) => {
      setDoctors(updatedDoctors);
      localStorage.setItem('cached_doctors', JSON.stringify(updatedDoctors));
    });
    return () => unsubscribe();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full mx-1">
      <div className="flex-grow flex flex-col">
        <Link to={`/doctors/${doctor.id}`} className="group">
          <div className="w-full aspect-[3/4] overflow-hidden relative bg-gray-100">
            {doctor.image && doctor.image !== PLACEHOLDER_IMAGE && (
              <img 
                src={doctor.image} 
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-transform duration-300 group-hover:blur-md"
              />
            )}
            {doctor.image && doctor.image !== PLACEHOLDER_IMAGE && <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300"></div>}
            <img
              src={doctor.image || PLACEHOLDER_IMAGE}
              alt={doctor.name}
              className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            {(!doctor.image || doctor.image === PLACEHOLDER_IMAGE) && (
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <img src={PLACEHOLDER_IMAGE} alt={doctor.name} className="w-1/2 h-1/2 object-contain opacity-30" />
              </div>
            )}
          </div>
          <div className="p-6 pb-3"> 
            <h3 className="font-semibold text-xl mb-1 text-gray-800 whitespace-pre-wrap">{doctor.name}</h3>
            <p className="text-brand-blue font-medium text-md whitespace-pre-wrap">{doctor.specialization}</p>
            {doctor.experience && doctor.experience.trim() !== "" && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 font-semibold">Опыт работы:</p>
                <p className="text-gray-600 text-sm whitespace-pre-wrap mt-0.5">{doctor.experience}</p>
              </div>
            )}
            {doctor.education && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 font-semibold">Образование:</p>
                <p className="text-gray-600 text-sm whitespace-pre-wrap mt-0.5">{doctor.education}</p>
              </div>
            )}
          </div>
        </Link>
        <div className="px-6 pb-3 mt-auto">
          <p className="text-xs text-blue-600 italic">
            Дни приёма и другие подробности - по кнопке 'Подробнее'.
          </p>
        </div>
        <div className="p-6 pt-2"> 
          <Link to={`/doctors/${doctor.id}`} className="block bg-brand-red hover:bg-red-700 text-white text-center py-3 px-4 rounded-md text-sm font-medium w-full transition-colors duration-300">
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
  
  const mobileSwiperParams = {
    modules: [Navigation, Pagination],
    spaceBetween: 10,
    slidesPerView: 1.5, 
    centeredSlides: true,
    navigation: true,
    pagination: { clickable: true },
    className: "py-4 mobile-swiper-doctors"
  };

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Наши врачи</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Команда высококвалифицированных специалистов с многолетним опытом работы
          </p>
        </div>
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Поиск врача по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-base"
            />
          </div>
        </div>

        {loading ? (
          <LoadingTextIndicator text="Загрузка врачей..." />
        ) : filteredDoctors.length > 0 ? (
          isMobile ? (
            <Swiper {...mobileSwiperParams} loop={filteredDoctors.length > 2}>
              {filteredDoctors.map((doctor) => (
                <SwiperSlide key={doctor.id} style={{height: 'auto'}}>
                  <DoctorCard doctor={doctor} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDoctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-500">Врачи не найдены.</p>
            <p className="text-gray-400 mt-2">Пожалуйста, измените параметры поиска или попробуйте позже.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;