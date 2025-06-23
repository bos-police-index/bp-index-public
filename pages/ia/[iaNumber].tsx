import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { format } from "date-fns";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import apolloClient from "@lib/apollo-client";
import { GET_IA_CASE_BY_NUMBER } from "@lib/graphql/queries";
import { officer_ia_alias_name } from "@utility/dataViewAliases";
import { bpi_light_green, bpi_deep_green } from "@styles/theme/lightTheme";
import IconWrapper from "@utility/tableDefinitions";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const iaNumber = context.params?.iaNumber as string;
  
  try {
    const { data } = await apolloClient.query({
      query: GET_IA_CASE_BY_NUMBER(iaNumber)
    });

    const iaCase = data[officer_ia_alias_name]?.nodes?.[0];
    
    if (!iaCase) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        iaCase
      }
    };
  } catch (error) {
    console.error('Error fetching IA case:', error);
    return {
      notFound: true
    };
  }
};

export default function IACase({ iaCase }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (finding: string) => {
    const finding_lower = finding?.toLowerCase() || '';
    if (finding_lower.includes('sustained')) return 'bg-red-100 text-red-800';
    if (finding_lower.includes('exonerated')) return 'bg-green-100 text-green-800';
    if (finding_lower.includes('unfounded')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <nav className="flex items-center space-x-2 text-sm font-medium mb-6">
            <Link href="/" className="hover:text-opacity-80 transition-colors" style={{ color: bpi_light_green }}>
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/data" className="hover:text-opacity-80 transition-colors" style={{ color: bpi_light_green }}>
              Data
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={{
                pathname: "/data/tables/[table_name]",
                query: { table_name: "officer_misconduct" }
              }}
              className="hover:text-opacity-80 transition-colors"
              style={{ color: bpi_light_green }}
            >
              Officer Misconduct
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Case #{iaCase.iaNumber}</span>
          </nav>

          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` 
                }}
              >
                <IconWrapper 
                  Icon={ReportProblemIcon}
                  color="white" 
                  fontSize="2rem" 
                />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Internal Affairs Case #{iaCase.iaNumber}
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-lg text-gray-600 leading-relaxed">
                  {iaCase.incidentType || 'Internal Affairs Investigation'}
                </p>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(iaCase.finding)}`}>
                  {iaCase.finding || 'Status Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Incident Type</div>
                <div className="mt-1 text-gray-900">{iaCase.incidentType || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Date Occurred</div>
                <div className="mt-1 text-gray-900">{formatDate(iaCase.occuredDate)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Date Received</div>
                <div className="mt-1 text-gray-900">{formatDate(iaCase.receivedDate)}</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Allegation Details</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {iaCase.allegationDetails || 'No details available.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Allegation Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Type</div>
                      <div className="mt-1 text-gray-900">{iaCase.allegationType || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Subtype</div>
                      <div className="mt-1 text-gray-900">{iaCase.allegationSubtype || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Case Outcome</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Action Taken</div>
                      <div className="mt-1 text-gray-900">{iaCase.actionTaken || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Disposition</div>
                      <div className="mt-1 text-gray-900">{iaCase.disposition || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Disciplines</div>
                      <div className="mt-1 text-gray-900">{iaCase.disciplines || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Officers and Allegations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badge No.
                  </th>
                  <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allegation
                  </th>
                  <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finding
                  </th>
                  <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {iaCase.bpiId ? (
                      <Link
                        href={{
                          pathname: "/profile/[bpiId]",
                          query: { bpiId: iaCase.bpiId }
                        }}
                        style={{ color: bpi_light_green, textDecoration: 'none' }}
                        className="hover:text-opacity-80 transition-colors"
                      >
                        {iaCase.firstName} {iaCase.lastName}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{iaCase.firstName} {iaCase.lastName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{iaCase.badgeNo || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{iaCase.rank || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{iaCase.allegation || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(iaCase.finding)}`}>
                      {iaCase.finding || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{iaCase.actionTaken || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
