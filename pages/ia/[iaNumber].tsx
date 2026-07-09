import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { format } from "date-fns/format";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { GridColDef } from "@mui/x-data-grid";

import apolloClient from "@lib/apollo-client";
import { GET_IA_CASE_BY_NUMBER } from "@lib/graphql/queries";
import { officer_ia_alias_name } from "@utility/dataViewAliases";
import { bpi_light_green, bpi_deep_green } from "@styles/theme/lightTheme";
import IconWrapper from "@utility/tableDefinitions";
import DataTable from "@components/DataTable";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const iaNumber = context.params?.iaNumber as string;
  
  if (!iaNumber) {
    return {
      notFound: true
    };
  }

  try {
    const { data, error, errors } = await apolloClient.query({
      query: GET_IA_CASE_BY_NUMBER(iaNumber),
      variables: {
        filters: {
          iaNumber: iaNumber
        }
      },
      errorPolicy: 'all',
      fetchPolicy: 'network-only'
    });

    if (error) {
      console.error('GraphQL error fetching IA case:', error);
    }
    
    if (errors && errors.length > 0) {
      console.error('GraphQL errors:', errors);
    }

    // Handle both edges and nodes structures
    let iaCase;
    if (data?.[officer_ia_alias_name]?.edges?.length > 0) {
      // If multiple edges, find the one matching the IA number (in case condition didn't work)
      const matchingEdge = data[officer_ia_alias_name].edges.find(
        edge => edge.node?.iaNumber === iaNumber
      );
      iaCase = matchingEdge?.node || data[officer_ia_alias_name].edges[0].node;
    } else if (data?.[officer_ia_alias_name]?.nodes?.length > 0) {
      // If multiple nodes, find the one matching the IA number
      const matchingNode = data[officer_ia_alias_name].nodes.find(
        node => node?.iaNumber === iaNumber
      );
      iaCase = matchingNode || data[officer_ia_alias_name].nodes[0];
    }
    
    // Map titleRank to rank for backward compatibility
    // Create a new object since Apollo objects are frozen
    if (iaCase && iaCase.titleRank && !iaCase.rank) {
      iaCase = {
        ...iaCase,
        rank: iaCase.titleRank
      };
    }
    
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
    console.error('Error details:', {
      message: error?.message,
      graphQLErrors: error?.graphQLErrors,
      networkError: error?.networkError
    });
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
    if (finding_lower.includes('sustained')) return 'bg-red-100 text-red-800 border border-red-200';
    if (finding_lower.includes('exonerated')) return 'bg-green-100 text-green-800 border border-green-200';
    if (finding_lower.includes('unfounded')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (finding_lower.includes('not sustained')) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (finding_lower.includes('pending')) return 'bg-purple-100 text-purple-800 border border-purple-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const fullName = [iaCase.firstName, iaCase.lastName].filter(Boolean).join(' ').trim();
  const iaCaseRow = {
    id: iaCase.iaNumber || 'unknown',
    iaNumber: iaCase.iaNumber,
    bpiId: iaCase.bpiId,
    firstName: iaCase.firstName,
    lastName: iaCase.lastName,
    fullName: fullName || 'Officer name not on file',
    badgeNo: iaCase.badgeNo,
    rank: iaCase.rank || iaCase.titleRank,
    titleRank: iaCase.titleRank || iaCase.rank,
    allegation: iaCase.allegation,
    finding: iaCase.finding,
    receivedDate: iaCase.receivedDate,
    actionTaken: iaCase.actionTaken,
    daysHoursSuspended: iaCase.daysHoursSuspended,
    incidentType: iaCase.incidentType,
    race: iaCase.race,
    sex: iaCase.sex,
  };

  const cols: GridColDef[] = [
    {
      field: 'iaNumber',
      headerName: 'IA Number',
      width: 150,
      renderCell: (params) => (
        <Link 
          href={{
            pathname: "/ia/[iaNumber]",
            query: { iaNumber: params.value }
          }}
          className="text-emerald-600"
        >
          {params.value}
        </Link>
      )
    },
    {
      field: 'incidentType',
      headerName: 'Incident Type',
      width: 180,
    },
    {
      field: 'receivedDate',
      headerName: 'Date Received',
      width: 140,
      type: 'date',
      valueFormatter: (params) => formatDate(params.value),
    },
    { 
      field: 'fullName', 
      headerName: 'Officer Name', 
      width: 180,
      renderCell: (params) => params.row.bpiId ? (
        <Link 
          href={{
            pathname: "/profile/[bpiId]",
            query: { bpiId: params.row.bpiId }
          }}
          className="text-emerald-600"
        >
          {params.value}
        </Link>
      ) : params.value
    },
    {
      field: 'badgeNo',
      headerName: 'Officer Badge',
      width: 120,
      type: 'number',
    },
    {
      field: 'allegation',
      headerName: 'Allegation',
      width: 220,
    },
    { 
      field: 'finding', 
      headerName: 'Finding', 
      width: 140,
      renderCell: (params) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(params.value)}`}>
          {params.value || 'N/A'}
        </span>
      )
    },
    {
      field: 'actionTaken',
      headerName: 'Action Taken',
      width: 180,
    },
    {
      field: 'daysHoursSuspended',
      headerName: 'Days/Hours Suspended',
      width: 160,
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <nav className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-6 sm:mb-8">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors duration-200">
              Home
            </Link>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <Link href="/data" className="text-slate-300 hover:text-white transition-colors duration-200">
              Data
            </Link>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <Link
              href={{
                pathname: "/data/tables/[table_name]",
                query: { table_name: "officer_misconduct" }
              }}
              className="text-slate-300 hover:text-white transition-colors duration-200"
            >
              Officer Misconduct
            </Link>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-slate-400 truncate">Case #{iaCase.iaNumber}</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-start sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20"
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
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 tracking-tight break-words">
                Internal Affairs Case #{iaCase.iaNumber}
              </h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                <p className="text-sm sm:text-base lg:text-lg text-gray-200 leading-relaxed">
                  {iaCase.incidentType || 'Internal Affairs Investigation'}
                </p>
                <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(iaCase.finding)}`}>
                  {iaCase.finding || 'Status Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-2 sm:mt-0">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Overview</h2>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Incident Type</div>
                <div className="mt-1 text-gray-900 font-medium">{iaCase.incidentType || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Date Received</div>
                <div className="mt-1 text-gray-900 font-medium">{formatDate(iaCase.receivedDate)}</div>
              </div>
              {iaCase.daysHoursSuspended && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Days/Hours Suspended</div>
                  <div className="mt-1 text-gray-900 font-medium">{iaCase.daysHoursSuspended}</div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Case Details</h2>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-6">
              {iaCase.allegation && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Allegation</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {iaCase.allegation}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-blue-100">Officer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Name</div>
                      <div className="mt-1 text-gray-900 font-medium">
                        {fullName || <span className="italic text-gray-400">Not on file</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Badge Number</div>
                      <div className="mt-1 text-gray-900 font-medium">{iaCase.badgeNo || 'N/A'}</div>
                    </div>
                    {iaCase.titleRank && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Rank</div>
                        <div className="mt-1 text-gray-900 font-medium">{iaCase.titleRank}</div>
                      </div>
                    )}
                    {(iaCase.race || iaCase.sex) && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Demographics</div>
                        <div className="mt-1 text-gray-900 font-medium">
                          {[iaCase.race, iaCase.sex].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-red-100">Case Outcome</h3>
                  <div className="space-y-3">
                    {iaCase.finding && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Finding</div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(iaCase.finding)}`}>
                            {iaCase.finding}
                          </span>
                        </div>
                      </div>
                    )}
                    {iaCase.actionTaken && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Action Taken</div>
                        <div className="mt-1 text-gray-900 font-medium">{iaCase.actionTaken}</div>
                      </div>
                    )}
                    {iaCase.daysHoursSuspended && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Days/Hours Suspended</div>
                        <div className="mt-1 text-gray-900 font-medium">{iaCase.daysHoursSuspended}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Comprehensive Case Information</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Complete details about the officer, allegations and outcome</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100 text-xs sm:text-sm text-purple-700 font-medium">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Detailed Record</span>
              </div>
            </div>
          </div>
          <div className="p-0">
            <div className="bg-gradient-to-b from-white to-purple-50/30 overflow-hidden">
              <DataTable 
                table={[iaCaseRow]} 
                cols={cols}
                table_name={`IACase-${iaCase.iaNumber}`}
                pageSize={5}
                pageSizeOptions={[5, 10]}
                rowCount={1}
                hide={[]}
                isServerSideRendered={false}
                checkboxSelection={true}
                className="w-full bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
